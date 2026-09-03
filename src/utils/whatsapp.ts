/**
 * WhatsApp Link Generator
 * Generates a wa.me link with a pre-filled message.
 */
export const generateWhatsAppLink = (phone: string, message: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

export const openWhatsApp = (phone: string, message: string) => {
  const link = generateWhatsAppLink(phone, message);
  window.open(link, '_blank');
};

export const whatsAppTemplates = {
  welcome: (name: string, plan: string, expiry: string) =>
    `🌟 *Welcome to GYMPRO!* 🌟\n\nHi ${name},\n\nWe're thrilled to have you join our community! Your fitness journey starts today.\n\n📋 *Membership Details:*\n• Plan: ${plan}\n• Status: Active\n• Valid Until: ${expiry}\n\n💪 Let's smash those goals together! If you have any questions, feel free to reach out.\n\nStay fit,\n*Team GYMPRO*`,

  welcomeWithCredentials: (name: string, plan: string, expiry: string, email: string, password: string) =>
    `🌟 *Welcome to GYMPRO!* 🌟\n\nHi ${name},\n\nYour membership is now active! You can log in to your personal portal to track your workouts, diet plan, and membership.\n\n📋 *Membership Details:*\n• Plan: ${plan}\n• Status: Active\n• Valid Until: ${expiry}\n\n🔑 *Login Credentials:*\n• Email: ${email}\n• Password: ${password}\n\n🌐 *Portal:* https://gympro-lemon.vercel.app/\n\nPlease change your password after logging in.\n\nStay fit,\n*Team GYMPRO*`,

  renewal: (name: string, plan: string, expiry: string) =>
    `✅ *Membership Renewed!*\n\nHi ${name},\n\nYour membership has been successfully renewed. Thank you for continuing your fitness journey with us!\n\n📈 *Updated Details:*\n• New Plan: ${plan}\n• New Expiry: ${expiry}\n\nKeep pushing your limits! 🏋️‍♂️\n\nBest regards,\n*Team GYMPRO*`,

  progress: (name: string, weight: string, fat: string, notes: string) =>
    `📊 *Performance Update*\n\nHi ${name},\n\nGreat job on your progress check-in today! Here's a quick summary:\n\n⚖️ *Current Metrics:*\n• Mass: ${weight} KG\n• Body Fat: ${fat}%\n📝 *Notes:* ${notes || 'Steady progress maintained.'}\n\nConsistency is the key to transformation. Keep up the solid work! 🏆\n\n*Team GYMPRO*`,

  birthday: (name: string) =>
    `🎂 *Happy Birthday, ${name}!* 🎈\n\nWarmest wishes from all of us at GYMPRO! May your day be filled with joy, and your year with strength and health. 🎊\n\nSee you at the gym!\n\nCheers,\n*Team GYMPRO*`,

  expiry: (name: string, date: string) =>
    `⚠️ *Membership Expiring Soon*\n\nHi ${name},\n\nYour GYMPRO membership is set to expire on *${date}*.\n\nDon't let your progress stop! Renew your plan soon to keep access to all facilities and training programs. 🏋️‍♀️\n\nLooking forward to seeing you at the gym!\n\n*Team GYMPRO*`,

  checkIn: (name: string) =>
    `👋 *Quick Check-in!*\n\nHi ${name},\n\nJust wanted to see how your workouts are going. We're here to support your fitness journey!\n\nIs there anything we can help you with today? Stay motivated! 🔥\n\n*Team GYMPRO*`,

  paymentReceipt: (name: string, amount: number) =>
    `💰 *Payment Received*\n\nHi ${name},\n\nWe have successfully received your payment of ₹${amount} towards your pending dues.\n\nThank you for clearing your balance. Keep up the great work at the gym! 💪\n\nBest regards,\n*Team GYMPRO*`
};
