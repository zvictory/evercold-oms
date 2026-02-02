# 🗺️ Yandex Maps Integration Setup Guide

## Overview

The EverCold CRM now uses **Yandex Maps 3.0 API** for all mapping features, replacing the MapLibre GL component. This provides:

- ✅ Real-time traffic data and visualization
- ✅ Accurate routing for Tashkent, Uzbekistan
- ✅ Turn-by-turn navigation with traffic updates
- ✅ Alternative route suggestions
- ✅ Live ETA calculations with traffic prediction

## Setup Steps

### 1. Get Your Yandex Maps API Key

1. Visit: https://developer.tech.yandex.com/services/34
2. Sign up or log in with your Yandex account
3. Create a new API key for Maps 3.0
4. Copy your API key (looks like: `abcdef123456789...`)

### 2. Update YandexMap Component

Open the file: `src/components/Map/YandexMap.tsx`

**Line 46** - Replace `YOUR_API_KEY`:

```typescript
// BEFORE:
script.src = 'https://api-maps.yandex.ru/v3/?apikey=YOUR_API_KEY&lang=en_US';

// AFTER:
script.src = 'https://api-maps.yandex.ru/v3/?apikey=your_actual_api_key_here&lang=en_US';
```

### 3. Restart Development Server

```bash
npm run dev
```

## Pages Using Yandex Maps

### ✅ Route Details Page
**URL:** `/routes/[routeId]`
- Shows full route with all stops
- Real-time traffic visualization
- Alternative route suggestions when traffic detected
- Live ETA updates

### ✅ Map Test Page
**URL:** `/map-test`
- Sample Tashkent delivery route
- Test markers and route visualization
- Verify Yandex Maps is loading correctly

### ✅ Driver Navigation
**URL:** `/driver/navigate?routeId=[id]&stopId=[id]`
- Turn-by-turn directions with traffic overlay
- Live ETA countdown
- Alternative route suggestions

## Features Enabled by API Key

Once you add your API key, you'll get:

| Feature | Status | Description |
|---------|--------|-------------|
| 🗺️ Base Map | ✅ | Street map of Tashkent region |
| 🚗 Traffic Layer | ✅ | Real-time road congestion colors |
| 🧭 Routing | ✅ | Calculate routes between points |
| 📍 Markers | ✅ | Place delivery stops on map |
| 📊 ETA Calculation | ✅ | Real-time travel time estimation |
| 🔄 Alternative Routes | ✅ | Suggest faster routes |
| ⏱️ Traffic Updates | ✅ | Real-time delay predictions |

## Troubleshooting

### Map Won't Load

**Problem:** Map shows spinning loader indefinitely

**Solutions:**
1. Verify API key is correct in `YandexMap.tsx` line 46
2. Check that API key is enabled in Yandex Developer Console
3. Ensure you have Maps 3.0 API enabled (not Maps 2.1)
4. Clear browser cache: `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
5. Check browser console for error messages: `F12` → Console tab

### Markers Not Showing

**Problem:** Map loads but no delivery stop markers visible

**Solutions:**
1. Check that route has valid latitude/longitude coordinates
2. Verify markers array is being passed correctly
3. Check browser console for JavaScript errors
4. Ensure map zoom level is appropriate for visible area

### Traffic Data Not Showing

**Problem:** No red/yellow traffic colors visible on roads

**Solutions:**
1. Set `showTraffic={true}` on YandexMap component (already done)
2. Verify Yandex Maps API key has traffic data enabled
3. Check that you're looking at major roads in Tashkent (smaller roads may not have traffic data)
4. Traffic data updates every 5 minutes; wait a moment for real-time data

## API Limits

Yandex Maps free tier includes:

- **25,000 requests/month** (routing + matrix API calls)
- **Unlimited display** of maps on your website
- **Real-time traffic** included with routing requests

**Estimated Usage for EverCold:**
- ~100 deliveries/day
- ~10 route API calls per delivery = 1,000/day
- ~30,000/month = Still within free tier ✅

**Cost Beyond Free Tier:**
- Additional requests: $0.005 per request
- Estimated cost at 500 deliveries/day: ~$15-20/month

## Advanced Configuration

### Custom Tile Styles

To customize map appearance, modify the `initMap()` function in `YandexMap.tsx`:

```typescript
const map = new YMap(mapContainer.current, {
  location: {
    center: { lng: center[0], lat: center[1] },
    zoom: zoom,
  },
  theme: 'light' // or 'dark' for dark mode
});
```

### Traffic Layer Customization

To show only specific traffic features:

```typescript
const trafficLayer = new YMapDefaultFeaturesLayer({
  customization: {
    'traffic:enabled': true,
    'traffic:incidents': true, // Show accidents/incidents
    'traffic:jam': true,        // Show traffic jams
  }
});
```

## Support & Documentation

- **Yandex Maps API Docs:** https://yandex.cloud/en/docs/maps/
- **API Reference:** https://yandex.cloud/en/docs/maps/routing/
- **Community Support:** https://tech.yandex.com/

## Files Using Yandex Maps

```
src/
├── components/Map/
│   └── YandexMap.tsx ⭐ Main component
├── app/
│   ├── routes/[routeId]/page.tsx
│   ├── map-test/page.tsx
│   └── driver/navigate/page.tsx
└── lib/
    ├── navigationService.ts
    ├── trafficMonitoringService.ts
    └── etaService.ts
```

## Migration Notes

**From MapLibre to Yandex Maps:**
- ✅ All marker interfaces remain the same
- ✅ Route coordinates format unchanged
- ✅ Component props compatible
- ✅ Traffic visualization improved
- ✅ ETA accuracy enhanced with real traffic data

## Next Steps

1. ✅ Get API key from Yandex
2. ✅ Add API key to `YandexMap.tsx`
3. ✅ Restart dev server
4. ✅ Test on `/map-test` page
5. ✅ View routes at `/routes/[routeId]`
6. ✅ Monitor usage in Yandex Developer Console

---

**Questions?** Check the troubleshooting section or review the YandexMap component code for inline comments.
