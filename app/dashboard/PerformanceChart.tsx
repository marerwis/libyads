"use client"

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend
);

export default function PerformanceChart() {

    const data = {
        labels: ['May 1', 'May 5', 'May 8', 'May 12', 'May 15', 'May 19', 'May 22', 'May 26', 'May 29'],
        datasets: [
            {
                label: 'Impressions',
                data: [50, 200, 310, 400, 500, 700, 800, 950, 1120],
                borderColor: '#3b82f6', // Blue 500
                backgroundColor: 'rgba(59, 130, 246, 0.2)', // Simulated gradient top
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: '#1f2937',
                pointBorderColor: '#3b82f6',
                pointBorderWidth: 2,
                pointRadius: 4,
                fill: true
            },
            {
                label: 'Clicks',
                data: [50, 180, 280, 380, 480, 650, 780, 900, 1100],
                borderColor: '#22d3ee', // Cyan 400
                backgroundColor: 'rgba(34, 211, 238, 0.2)',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: '#1f2937',
                pointBorderColor: '#22d3ee',
                pointBorderWidth: 2,
                pointRadius: 4,
                fill: true
            },
            {
                label: 'Conversions',
                data: [60, 250, 400, 480, 600, 750, 900, 980, 1020],
                borderColor: '#4ade80', // Green 400
                backgroundColor: 'rgba(74, 222, 128, 0.2)',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: '#1f2937',
                pointBorderColor: '#4ade80',
                pointBorderWidth: 2,
                pointRadius: 4,
                fill: true
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                titleColor: '#f3f4f6',
                bodyColor: '#d1d5db',
                borderColor: '#374151',
                borderWidth: 1,
                padding: 10,
                displayColors: true,
                usePointStyle: true,
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    drawBorder: false
                },
                ticks: {
                    color: '#9ca3af',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    }
                }
            },
            y: {
                grid: {
                    color: 'rgba(75, 85, 99, 0.2)',
                    drawBorder: false,
                    borderDash: [5, 5]
                },
                ticks: {
                    color: '#9ca3af',
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    },
                    stepSize: 200
                },
                beginAtZero: true
            }
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false
        }
    };

    return <Line options={options} data={data} />;
}
