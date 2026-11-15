# FocusTracker

Sistema inteligente de análisis de comportamiento digital y gestión del tiempo mediante
clasificación con IA. Proyecto de título de Renato Gana Fuentes (UNAB, 2026).

Tres partes:

| Carpeta | Qué es |
|---|---|
| `src/` | App móvil React Native (Expo + Expo Router, TypeScript) |
| `backend/` | API FastAPI + MongoDB + modelo Random Forest (scikit-learn) |
| `modules/usage-stats/` | Módulo nativo Android (Kotlin) que lee el uso real del teléfono |

## 1. App móvil

```bash
npm install
npx expo start            # Expo Go (QR) o --web para navegador
```
Funciona sola, con datos simulados y clasificación por reglas.

## 2. Backend (opcional)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m app.model                                    # entrena y guarda models/rf.joblib
python -m pytest -q                                    # 7 pruebas
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
- Sin `MONGODB_URI` usa una base en memoria (se pierde al reiniciar). Con MongoDB Atlas:
  `export MONGODB_URI="mongodb+srv://usuario:clave@cluster/..."` (nunca subas esta cadena a un repositorio).
- Endpoints: `GET /health`, `POST /v1/sync`, `GET /v1/users/{id}/history`, `DELETE /v1/users/{id}`.
- Conectar la app: en **Perfil → Servidor de análisis** escribe la URL (desde el teléfono usa la IP de tu
  computador, p. ej. `http://192.168.1.20:8000`) o define `EXPO_PUBLIC_API_URL` antes de `npx expo start`.
- Para producción restringe `CORS_ORIGINS` y publica el backend con HTTPS.

### Sobre el modelo Random Forest
**La exactitud de 100% del entrenamiento NO es una validación real.** No hay todavía datos reales
etiquetados por personas: el modelo se entrena con datos sintéticos etiquetados por las reglas de la
etapa 1, así que las reproduce. Aporta fronteras de decisión suaves y probabilidades, no precisión
demostrada. Para validarlo hay que recolectar datos reales y etiquetarlos (p. ej. con encuestas de
autopercepción) y reentrenar.

## 3. Generar el APK (ícono propio + uso real en Android)

El APK se compila en la nube de Expo (EAS Build), gratis con una cuenta de Expo (expo.dev).

```bash
npm install -g eas-cli
eas login                                   # tu cuenta de expo.dev
eas build:configure                         # una sola vez; acepta las opciones por defecto
eas build -p android --profile preview      # genera un .apk (tarda ~10-20 min)
```
Al terminar, EAS entrega un enlace/QR para descargar el `.apk`. Ábrelo en tu teléfono Android
(permite «instalar apps de origen desconocido» si lo pide). Quedará instalado con su propio ícono
y nombre «FocusTracker».

Alternativa local (requiere Android Studio + JDK 17): `npx expo run:android` con el teléfono por USB.

### Uso real
En la app: **Perfil → Usar mi uso real (Android)**. Se abrirá *Ajustes → Acceso a datos de uso*;
activa FocusTracker y vuelve a la app. Se leen los últimos 14 días. Solo se leen apps con ícono de
lanzador; las que Android no categoriza y no están en la lista conocida (`src/lib/realdata.ts`)
no se monitorean.

**El módulo Kotlin (`modules/usage-stats`) NO se ha compilado ni probado en un teléfono.** Si el
build falla o el uso real sale vacío, copia el error completo y se corrige.

## Requisitos de la tesis
RF1 `setup.tsx` · RF2 `consent.tsx` + 403 en backend sin consentimiento · RF3 `data.ts` / módulo Android ·
RF4 Perfil · RF5 `analysis.ts` + `backend/app/model.py` · RF6 Inicio · RF7 Consejos · RF8 Alertas ·
RF9 Estadísticas · RF10 Metas · RF11 `backend/app/main.py` · RF12 Inicio/Estadísticas.
