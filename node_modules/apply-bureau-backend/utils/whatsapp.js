const logger = require('./logger');

class WhatsAppManager {
  constructor() {
    this.adminWhatsAppNumber = process.env.ADMIN_WHATSAPP_NUMBER || '+1234567890'; // Default admin WhatsApp
    this.businessName = 'Apply Bureau';
  }

  /**
   * Format WhatsApp number to international format
   * @param {string} number - Phone number in any format
   * @returns {string} - Formatted WhatsApp number
   */
  formatWhatsAppNumber(number) {
    if (!number) return null;
    
    // Remove all non-digit characters
    const cleaned = number.replace(/\D/g, '');
    
    // Add + if not present and ensure it starts with country code
    if (cleaned.length === 10) {
      // Assume US number if 10 digits
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    } else if (!cleaned.startsWith('+')) {
      return `+${cleaned}`;
    }
    
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  }

  /**
   * Generate WhatsApp call link for consultation
   * @param {Object} consultation - Consultation object
   * @returns {Object} - WhatsApp contact details
   */
  generateWhatsAppContactInfo(consultation) {
    const adminNumber = this.formatWhatsAppNumber(
      consultation.admin_whatsapp_number || this.adminWhatsAppNumber
    );
    
    const clientNumber = this.formatWhatsAppNumber(consultation.whatsapp_number);
    
    // Create consultation message template
    const consultationDate = new Date(consultation.scheduled_at).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const consultationTime = new Date(consultation.scheduled_at).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    const message = `Hello! This is ${this.businessName}. I'm ready for our consultation scheduled for ${consultationDate} at ${consultationTime}. Looking forward to discussing your career goals!`;
    
    // Generate WhatsApp web link for easy access
    const whatsappWebLink = `https://wa.me/${adminNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
    
    return {
      adminNumber,
      clientNumber,
      whatsappWebLink,
      consultationMessage: message,
      formattedDate: consultationDate,
      formattedTime: consultationTime
    };
  }

  /**
   * Create WhatsApp consultation instructions
   * @param {Object} consultation - Consultation object
   * @returns {Object} - Instructions for WhatsApp consultation
   */
  createWhatsAppInstructions(consultation) {
    const contactInfo = this.generateWhatsAppContactInfo(consultation);
    
    return {
      ...contactInfo,
      instructions: [
        `Save this WhatsApp number: ${contactInfo.adminNumber}`,
        'Make sure you have WhatsApp installed on your phone',
        'At the scheduled time, call the saved number via WhatsApp',
        'If no answer, please send a WhatsApp message first',
        'Have a stable internet connection for the best call quality'
      ],
      backupOptions: [
        'If WhatsApp call fails, we can switch to a regular phone call',
        'Meeting link is also available as backup if needed'
      ]
    };
  }

  /**
   * Validate WhatsApp number format
   * @param {string} number - Phone number to validate
   * @returns {boolean} - Whether number is valid for WhatsApp
   */
  isValidWhatsAppNumber(number) {
    if (!number) return false;
    
    const formatted = this.formatWhatsAppNumber(number);
    // Basic validation: should be at least 10 digits with country code
    return formatted && formatted.length >= 12 && formatted.startsWith('+');
  }

  /**
   * Generate consultation reminder message for WhatsApp
   * @param {Object} consultation - Consultation object
   * @param {number} hoursBeforeReminder - Hours before consultation to send reminder
   * @returns {string} - Reminder message
   */
  generateReminderMessage(consultation, hoursBeforeReminder = 24) {
    const contactInfo = this.generateWhatsAppContactInfo(consultation);
    
    return `Hi ${consultation.prospect_name || 'there'}! This is a reminder that we have a WhatsApp consultation scheduled for ${contactInfo.formattedDate} at ${contactInfo.formattedTime}. Please make sure WhatsApp is ready and you have a good internet connection. Looking forward to our call! - ${this.businessName}`;
  }

  /**
   * Log WhatsApp consultation activity
   * @param {string} consultationId - Consultation ID
   * @param {string} action - Action performed
   * @param {Object} details - Additional details
   */
  logWhatsAppActivity(consultationId, action, details = {}) {
    logger.info('WhatsApp consultation activity', {
      consultationId,
      action,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generate email template data for WhatsApp consultation
   * @param {Object} consultation - Consultation object
   * @returns {Object} - Email template data
   */
  generateEmailTemplateData(consultation) {
    const contactInfo = this.generateWhatsAppContactInfo(consultation);
    
    return {
      // Basic consultation data
      prospect_name: consultation.prospect_name,
      consultation_date: contactInfo.formattedDate,
      consultation_time: contactInfo.formattedTime,
      
      // WhatsApp-specific data for email
      is_whatsapp_call: consultation.communication_method === 'whatsapp_call',
      client_phone_number: consultation.whatsapp_number || consultation.phone_number,
      
      // Additional context
      business_name: this.businessName,
      communication_method: consultation.communication_method
    };
  }
}

module.exports = new WhatsAppManager();