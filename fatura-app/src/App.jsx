import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

// 🔑 Şirket içinde izin verilen kullanıcıların listesi
const USERS = [
  { username: 'admin', password: '123' },
  { username: 'ahmet', password: '456' },
  { username: 'mehmet', password: '789' }
];

// 🔗 n8n Production Webhook Adresin
const WEBHOOK_URL = "http://192.168.1.35:5678/webhook/faturaai";

// 🛠️ Yüksek boyutlu fotoğrafları otomatik sıkıştıran yardımcı fonksiyon (Canvas)
const compressImage = (file, maxWidth = 1280, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name || 'fatura.jpg', { type: 'image/jpeg' }));
            } else {
              reject(new Error('Sıkıştırma hatası oluştu.'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

function App() {
  // --- Oturum & Giriş Durumları ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [currentUser, setCurrentUser] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- Fatura Yükleme Durumları ---
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Giriş İşlemi Kontrolü
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    const foundUser = USERS.find(
      (user) => user.username === loginUsername && user.password === loginPassword
    );

    if (foundUser) {
      setIsLoggedIn(true);
      setCurrentUser(foundUser.username);
    } else {
      setLoginError('Kullanıcı adı veya şifre hatalı!');
    }
  };

  // 2. Çıkış Yapma İşlemi
  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoginUsername('');
    setLoginPassword('');
    setMessage('');
  };

  // 3. Fotoğraf Çekme, Sıkıştırma ve Gönderme İşlemi
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setMessage('📸 Fotoğraf optimize ediliyor ve işleniyor, lütfen bekleyin...');

    try {
      // 1. Görseli n8n'e göndermeden önce boyutunu düşürüyoruz
      const compressedFile = await compressImage(file);

      // 2. n8n'in kabul edeceği FormData paketini hazırlıyoruz
      const formData = new FormData();
      formData.append('data', compressedFile); // n8n ikili veri anahtarı
      formData.append('uploaded_by', currentUser);

      // 3. n8n Webhook İsteği
      const response = await axios.post(WEBHOOK_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 saniye zaman aşımı toleransı
      });

      if (response.status === 200 || response.status === 201) {
        setMessage('✅ Fatura başarıyla gönderildi!');
      } else {
        setMessage('⚠️ Fatura gönderildi ancak beklenmeyen bir yanıt alındı.');
      }
    } catch (err) {
      console.error('Gönderim hatası:', err);
      if (err.code === 'ECONNABORTED') {
        setMessage('❌ İstek zaman aşıma uğradı. Lütfen bağlantınızı kontrol edin.');
      } else {
        setMessage('❌ Gönderim sırasında hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
      e.target.value = ''; // Aynı dosyanın tekrar seçilebilmesi için input'u sıflıyoruz
    }
  };

  return (
    <div className="container">
      {/* --- EKRAN 1: GİRİŞ EKRANI --- */}
      {!isLoggedIn ? (
        <div className="card">
          <h2>Giriş Yap</h2>
          <p className="subtitle">Fatura sistemine erişmek için bilgilerinizi girin.</p>
          
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="text"
              placeholder="Kullanıcı Adı"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Şifre"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
            {loginError && <p className="error">{loginError}</p>}
            <button type="submit" className="btn btn-primary">
              Giriş Yap
            </button>
          </form>
        </div>
      ) : (
        /* --- EKRAN 2: FATURA YÜKLEME EKRANI --- */
        <div className="card">
          <div className="user-header">
            <span>Hoş geldin, <strong>{currentUser}</strong></span>
            <button onClick={handleLogout} className="btn-logout">Çıkış Yap</button>
          </div>

          <h2>Fatura Yükleme Arayüzü</h2>

          <label htmlFor="cameraInput" className={`btn btn-camera ${loading ? 'disabled' : ''}`}>
            📷 {loading ? 'İşleniyor...' : 'Kamerayı Aç ve Çek'}
          </label>
          
          <input
            id="cameraInput"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            disabled={loading}
            style={{ display: 'none' }}
          />

          {message && <div className="status-message">{message}</div>}
        </div>
      )}
    </div>
  );
}

export default App;