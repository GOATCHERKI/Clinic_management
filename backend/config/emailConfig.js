const emailConfig = {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'REMOVED_EMAIL',
        pass: process.env.EMAIL_PASS || 'REMOVED_SECRET'
    },
    from: process.env.EMAIL_USER || 'REMOVED_EMAIL',
    tls: {
        rejectUnauthorized: false
    },
    // Add connection timeouts
    connectionTimeout: 60000, 
    greetingTimeout: 30000,   
    socketTimeout: 60000      
};

export default emailConfig; 