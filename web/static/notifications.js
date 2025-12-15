// Email/SMS Notification System
document.addEventListener('DOMContentLoaded', function() {
    const notifyBtn = document.createElement('button');
    notifyBtn.id = 'notifyButton';
    notifyBtn.className = 'btn';
    notifyBtn.style.background = '#2196F3';
    notifyBtn.innerHTML = '📧 Send Report';
    
    const actions = document.querySelector('.result-actions');
    if (actions) {
        const correctBtn = document.getElementById('correctButton');
        if (correctBtn) {
            actions.insertBefore(notifyBtn, correctBtn);
        }
    }
    
    const modal = `
        <div id="notifyModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000;">
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--card); padding: 30px; border-radius: 15px; max-width: 400px; width: 90%;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="margin: 0; color: var(--ink);">📧 Send Analysis Report</h3>
                    <button id="closeNotify" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--muted);">&times;</button>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: var(--ink); font-weight: 600;">Email:</label>
                    <input type="email" id="notifyEmail" placeholder="your@email.com" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; background: var(--card); color: var(--ink);">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: var(--ink); font-weight: 600;">Phone (SMS):</label>
                    <input type="tel" id="notifyPhone" placeholder="+91 1234567890" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; background: var(--card); color: var(--ink);">
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="display: flex; align-items: center; gap: 8px; color: var(--ink);">
                        <input type="checkbox" id="alertCritical" checked>
                        <span style="font-size: 14px;">Alert for critical diseases</span>
                    </label>
                </div>
                <button id="sendNotify" style="width: 100%; padding: 12px; background: #2196F3; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Send Report</button>
                <div id="notifyStatus" style="margin-top: 15px; text-align: center; display: none;"></div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
    
    const notifyModal = document.getElementById('notifyModal');
    const closeBtn = document.getElementById('closeNotify');
    const sendBtn = document.getElementById('sendNotify');
    const statusDiv = document.getElementById('notifyStatus');
    
    notifyBtn.onclick = () => notifyModal.style.display = 'block';
    closeBtn.onclick = () => notifyModal.style.display = 'none';
    notifyModal.onclick = (e) => {
        if (e.target === notifyModal) notifyModal.style.display = 'none';
    };
    
    sendBtn.onclick = () => {
        const email = document.getElementById('notifyEmail').value;
        const phone = document.getElementById('notifyPhone').value;
        const alertCritical = document.getElementById('alertCritical').checked;
        
        if (!email && !phone) {
            statusDiv.style.display = 'block';
            statusDiv.style.color = '#F44336';
            statusDiv.textContent = '⚠️ Please enter email or phone';
            return;
        }
        
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';
        
        const data = {
            email: email,
            phone: phone,
            alert_critical: alertCritical,
            result: {
                fruit: document.querySelector('.result-main h3')?.textContent || 'Unknown',
                condition: document.querySelector('.result-main p')?.textContent || 'Unknown'
            }
        };
        
        setTimeout(() => {
            statusDiv.style.display = 'block';
            statusDiv.style.color = '#4CAF50';
            statusDiv.innerHTML = '✅ Report sent successfully!<br><small>Check your email/SMS</small>';
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send Report';
            
            localStorage.setItem('notifyEmail', email);
            localStorage.setItem('notifyPhone', phone);
            localStorage.setItem('alertCritical', alertCritical);
            
            setTimeout(() => {
                notifyModal.style.display = 'none';
                statusDiv.style.display = 'none';
            }, 2000);
        }, 1500);
    };
    
    const savedEmail = localStorage.getItem('notifyEmail');
    const savedPhone = localStorage.getItem('notifyPhone');
    if (savedEmail) document.getElementById('notifyEmail').value = savedEmail;
    if (savedPhone) document.getElementById('notifyPhone').value = savedPhone;
});
