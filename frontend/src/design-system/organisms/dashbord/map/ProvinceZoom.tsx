"use client";

import { useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

type Bounds = [[number, number], [number, number]]

type PlaceResult = {
    boundingbox?: [string, string, string, string]
}

type PlaceNames = {
    provinceName?: string
    cityName?: string
    villageName?: string
}

type Props = PlaceNames & {
    enabled?: boolean
}

const cache = new Map<string, Promise<Bounds>>()
let queue: Promise<void> = Promise.resolve()

const delay = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms))

function normalizeName(value = '') {
    return value
        .replace(/ي/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/\u200c/g, ' ')
        .trim()
        .replace(/^(?:استان|شهرستان|شهر|روستای|روستا)\s+/, '')
        .replace(/\s+/g, ' ')
        .trim()
}

function getPlaceBounds({
    provinceName,
    cityName,
    villageName,
}: PlaceNames): Promise<Bounds> {
    const province = normalizeName(provinceName)
    const city = normalizeName(cityName)
    const village = normalizeName(villageName)

    const targetName = village || city || province

    if (!targetName) {
        return Promise.reject(new Error('نام موقعیت خالی است'))
    }

    // نام استان هم در کلید باشد تا مکان‌های هم‌نام تداخل نکنند
    const key = JSON.stringify([province, city, village])

    const saved = cache.get(key)
    if (saved) return saved

    const request = queue.then(async (): Promise<Bounds> => {
        const params = new URLSearchParams({
            countrycodes: 'ir',
            format: 'jsonv2',
            limit: '1',
            'accept-language': 'fa',
        })

        if (village || city) {
            const parts = [village, city, province, 'ایران'].filter(Boolean)

            params.set('q', [...new Set(parts)].join(', '))
            params.set('featureType', 'settlement')
        } else {
            params.set('state', province)
            params.set('featureType', 'state')
        }

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?${params.toString()}`,
                {
                    signal: controller.signal,
                    referrerPolicy: 'strict-origin-when-cross-origin',
                    headers: { Accept: 'application/json' },
                },
            )

            if (!response.ok) {
                throw new Error(`خطا در دریافت موقعیت (${response.status})`)
            }

            const results: PlaceResult[] = await response.json()
            const box = results[0]?.boundingbox

            if (!box || box.length !== 4) {
                throw new Error(`موقعیت «${targetName}» پیدا نشد`)
            }

            // ترتیب پاسخ: جنوب، شمال، غرب، شرق
            const [south, north, west, east] = box.map(Number)

            if (
                ![south, north, west, east].every(Number.isFinite) ||
                south >= north ||
                west >= east ||
                south < -90 ||
                north > 90 ||
                west < -180 ||
                east > 180
            ) {
                throw new Error('محدوده موقعیت معتبر نیست')
            }

            return [
                [south, west],
                [north, east],
            ]
        } finally {
            clearTimeout(timeout)
        }
    })

    // فاصله میان درخواست‌ها حفظ شود
    queue = request.then(
        () => delay(1100),
        () => delay(1100),
    )

    cache.set(key, request)

    void request.catch(() => {
        cache.delete(key)
    })

    return request
}

export default function ProvinceZoom({
    provinceName,
    cityName,
    villageName,
    enabled = true,
}: Props) {
    const map = useMap()
    const [error, setError] = useState('')

    const province = normalizeName(provinceName)
    const city = normalizeName(cityName)
    const village = normalizeName(villageName)

    useEffect(() => {
        setError('')

        if (!enabled || (!province && !city && !village)) return

        let cancelled = false

        async function zoomToPlace() {
            try {
                const bounds = await getPlaceBounds({
                    provinceName: province,
                    cityName: city,
                    villageName: village,
                })

                if (cancelled) return

                const maxZoom = village ? 15 : city ? 13 : 10

                map.invalidateSize({ pan: false })
                map.flyToBounds(L.latLngBounds(bounds), {
                    padding: [24, 24],
                    maxZoom: Math.min(map.getMaxZoom(), maxZoom),
                    animate: true,
                    duration: 1.2,
                })
            } catch (err) {
                if (cancelled) return

                setError(
                    err instanceof Error
                        ? err.name === 'AbortError'
                            ? 'دریافت موقعیت طول کشید؛ دوباره امتحان کن'
                            : err.message
                        : 'دریافت موقعیت انجام نشد',
                )
            }
        }

        void zoomToPlace()

        return () => {
            cancelled = true
        }
    }, [province, city, village, enabled, map])

    if (!enabled || !error) return null

    return (
        <div
            role="alert"
            dir="rtl"
            className="
                absolute
                top-3
                left-1/2
                -translate-x-1/2
                z-[1000]
                w-fit
                rounded-lg
                bg-white
                px-3 py-2
                text-sm
                text-red-600
                shadow
            "
        >
            {error}
        </div>
    )
}
