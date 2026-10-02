/**
 * Kurva gerak tunggal untuk seluruh app: turun cepat, mendarat pelan.
 * Dipakai di semua transisi framer-motion supaya gerak terasa satu tangan,
 * bukan campuran default `easeOut` per komponen.
 */
export const EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];
