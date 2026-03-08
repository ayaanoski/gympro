/**
 * WhatsApp Link Generator
 * Generates a wa.me link with a pre-filled message.
 */
export const generateWhatsAppLink = (phone: string, message: string) => {
  // Remove any non-numeric characters from the phone number
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Ensure the phone number has a country code (defaulting to 91 for India if not present)
  // This is a common requirement for wa.me links. 
  // In a real app, you might want to handle this more dynamically.
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

export const openWhatsApp = (phone: string, message: string) => {
  const link = generateWhatsAppLink(phone, message);
  window.open(link, '_blank');
};
