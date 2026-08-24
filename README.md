# AI Destekli Fatura & Fiş Okuma Otomasyonu

Bu proje; mobil/web arayüzünden yüklenen fatura fotoğraflarını **Google Gemini Vision API** ile analiz eden, **n8n** üzerinden işleyerek **Google Sheets / ERP** sistemine aktaran uçtan uca bir otomasyondur.

## 🚀 Kurulum Adımları

### 1. n8n İş Akışı
1. n8n arayüzünü açın.
2. `workflows/fatura-okuma-workflow.json` dosyasını içe aktarın (Import).
3. **Google Sheets** ve **Google Gemini** kimlik bilgilerini (Credentials) kendi hesaplarınızla tanımlayın.
4. Akışı **Active / Publish** konumuna getirin.

### 2. React Arayüzü
```bash
cd fatura-app
npm install
npm run dev
