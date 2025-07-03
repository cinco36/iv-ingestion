/**
 * Webhook Service
 * Handles webhook registration, event delivery, retry logic, and security
 */

import crypto from 'crypto';
import axios from 'axios';
import { EventEmitter } from 'events';

class WebhookService extends EventEmitter {
  constructor() {
    super();
    this.webhooks = new Map();
    this.deliveryQueue = [];
    this.retryDelays = [1000, 5000, 15000, 60000, 300000]; // Exponential backoff
    this.maxRetries = 5;
    this.isProcessing = false;
    
    // Start processing queue
    this.processQueue();
  }

  /**
   * Register a new webhook
   */
  async registerWebhook(webhookData) {
    const {
      url,
      events,
      description = '',
      userId,
      secret = this.generateSecret()
    } = webhookData;

    // Validate URL
    if (!this.isValidUrl(url)) {
      throw new Error('Invalid webhook URL');
    }

    // Validate events
    if (!Array.isArray(events) || events.length === 0) {
      throw new Error('At least one event must be specified');
    }

    const webhookId = this.generateWebhookId();
    const webhook = {
      id: webhookId,
      url,
      events,
      description,
      userId,
      secret,
      isActive: true,
      createdAt: new Date(),
      lastTriggered: null,
      deliveryStats: {
        total: 0,
        successful: 0,
        failed: 0,
        lastDelivery: null
      }
    };

    this.webhooks.set(webhookId, webhook);
    
    // Emit webhook registered event
    this.emit('webhook:registered', webhook);
    
    return webhook;
  }

  /**
   * Unregister a webhook
   */
  async unregisterWebhook(webhookId) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    webhook.isActive = false;
    this.webhooks.delete(webhookId);
    
    // Emit webhook unregistered event
    this.emit('webhook:unregistered', webhook);
    
    return { success: true };
  }

  /**
   * Get webhook by ID
   */
  getWebhook(webhookId) {
    return this.webhooks.get(webhookId);
  }

  /**
   * Get all webhooks for a user
   */
  getUserWebhooks(userId) {
    return Array.from(this.webhooks.values())
      .filter(webhook => webhook.userId === userId && webhook.isActive);
  }

  /**
   * Get all active webhooks
   */
  getAllWebhooks() {
    return Array.from(this.webhooks.values())
      .filter(webhook => webhook.isActive);
  }

  /**
   * Trigger webhook event
   */
  async triggerEvent(eventType, data) {
    const webhooks = this.getAllWebhooks()
      .filter(webhook => webhook.events.includes(eventType));

    if (webhooks.length === 0) {
      return { triggered: 0 };
    }

    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
      id: this.generateEventId()
    };

    const deliveryPromises = webhooks.map(webhook => 
      this.deliverWebhook(webhook, payload)
    );

    const results = await Promise.allSettled(deliveryPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    // Emit delivery summary
    this.emit('webhook:delivery_summary', {
      eventType,
      total: webhooks.length,
      successful,
      failed,
      payload
    });

    return {
      triggered: webhooks.length,
      successful,
      failed
    };
  }

  /**
   * Deliver webhook to endpoint
   */
  async deliverWebhook(webhook, payload, attempt = 0) {
    const deliveryId = this.generateDeliveryId();
    const startTime = Date.now();

    try {
      // Create signature
      const signature = this.createSignature(payload, webhook.secret);
      
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'IV-Ingestion-Webhook/1.0.0',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event,
        'X-Webhook-Delivery': deliveryId,
        'X-Webhook-Attempt': attempt + 1
      };

      // Make request
      const response = await axios.post(webhook.url, payload, {
        headers,
        timeout: 30000, // 30 second timeout
        validateStatus: () => true // Don't throw on HTTP errors
      });

      const deliveryTime = Date.now() - startTime;
      
      // Update webhook stats
      webhook.deliveryStats.total++;
      webhook.deliveryStats.lastDelivery = new Date();
      
      if (response.status >= 200 && response.status < 300) {
        webhook.deliveryStats.successful++;
        webhook.lastTriggered = new Date();
        
        // Log successful delivery
        console.log(`Webhook delivered successfully: ${webhook.id} -> ${webhook.url} (${deliveryTime}ms)`);
        
        return {
          success: true,
          deliveryId,
          statusCode: response.status,
          deliveryTime
        };
      } else {
        webhook.deliveryStats.failed++;
        
        // Log failed delivery
        console.warn(`Webhook delivery failed: ${webhook.id} -> ${webhook.url} (${response.status})`);
        
        // Retry if we haven't exceeded max retries
        if (attempt < this.maxRetries) {
          await this.scheduleRetry(webhook, payload, attempt + 1);
        }
        
        return {
          success: false,
          deliveryId,
          statusCode: response.status,
          deliveryTime,
          error: `HTTP ${response.status}`
        };
      }
    } catch (error) {
      const deliveryTime = Date.now() - startTime;
      webhook.deliveryStats.total++;
      webhook.deliveryStats.failed++;
      
      console.error(`Webhook delivery error: ${webhook.id} -> ${webhook.url}`, error.message);
      
      // Retry if we haven't exceeded max retries
      if (attempt < this.maxRetries) {
        await this.scheduleRetry(webhook, payload, attempt + 1);
      }
      
      return {
        success: false,
        deliveryId,
        deliveryTime,
        error: error.message
      };
    }
  }

  /**
   * Schedule webhook retry
   */
  async scheduleRetry(webhook, payload, attempt) {
    const delay = this.retryDelays[Math.min(attempt - 1, this.retryDelays.length - 1)];
    
    setTimeout(async () => {
      await this.deliverWebhook(webhook, payload, attempt);
    }, delay);
  }

  /**
   * Process delivery queue
   */
  async processQueue() {
    if (this.isProcessing || this.deliveryQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.deliveryQueue.length > 0) {
      const delivery = this.deliveryQueue.shift();
      try {
        await this.deliverWebhook(delivery.webhook, delivery.payload, delivery.attempt);
      } catch (error) {
        console.error('Error processing webhook delivery:', error);
      }
      
      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
  }

  /**
   * Create HMAC signature for webhook payload
   */
  createSignature(payload, secret) {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload, signature, secret) {
    const expectedSignature = this.createSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Generate webhook ID
   */
  generateWebhookId() {
    return `wh_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate event ID
   */
  generateEventId() {
    return `evt_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate delivery ID
   */
  generateDeliveryId() {
    return `del_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate webhook secret
   */
  generateSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate URL
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  /**
   * Get webhook statistics
   */
  getWebhookStats(webhookId) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return null;
    }

    return {
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      isActive: webhook.isActive,
      createdAt: webhook.createdAt,
      lastTriggered: webhook.lastTriggered,
      deliveryStats: webhook.deliveryStats
    };
  }

  /**
   * Get global webhook statistics
   */
  getGlobalStats() {
    const webhooks = this.getAllWebhooks();
    
    const stats = {
      totalWebhooks: webhooks.length,
      activeWebhooks: webhooks.filter(w => w.isActive).length,
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageDeliveryTime: 0
    };

    webhooks.forEach(webhook => {
      stats.totalDeliveries += webhook.deliveryStats.total;
      stats.successfulDeliveries += webhook.deliveryStats.successful;
      stats.failedDeliveries += webhook.deliveryStats.failed;
    });

    if (stats.totalDeliveries > 0) {
      stats.successRate = (stats.successfulDeliveries / stats.totalDeliveries) * 100;
    }

    return stats;
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(webhookId) {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery',
        testId: this.generateEventId()
      },
      id: this.generateEventId()
    };

    return await this.deliverWebhook(webhook, testPayload);
  }

  /**
   * Clean up old webhook data
   */
  cleanup() {
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    for (const [id, webhook] of this.webhooks.entries()) {
      if (!webhook.isActive && webhook.lastTriggered < cutoffDate) {
        this.webhooks.delete(id);
      }
    }
  }
}

// Export singleton instance
export const webhookService = new WebhookService();

// Export class for testing
export { WebhookService }; 