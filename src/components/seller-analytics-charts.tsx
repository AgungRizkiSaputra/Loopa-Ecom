"use client";

import React, { useMemo, useState } from "react";
import { Order, Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Layers,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  Activity,
} from "lucide-react";

interface SellerAnalyticsChartsProps {
  orders: Order[];
  products: Product[];
}

const DAY_NAMES_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

function formatCompactRp(val: number): string {
  if (val === 0) return "Rp 0";
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)}jt`;
  if (val >= 1_000) return `Rp ${Math.round(val / 1_000)}rb`;
  return `Rp ${val}`;
}

export function SellerAnalyticsCharts({
  orders,
  products,
}: SellerAnalyticsChartsProps) {
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [chartMetric, setChartMetric] = useState<"revenue" | "orders">("revenue");
  const [hoveredDayIdx, setHoveredDayIdx] = useState<number | null>(null);

  // 1. 7-Day Daily Sales & Order Trend
  const dailySeries = useMemo(() => {
    const days: {
      key: string;
      label: string;
      fullDate: string;
      revenue: number;
      pendingRevenue: number;
      orderCount: number;
      unitsSold: number;
    }[] = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      const dayLabel = i === 0 ? "Hari Ini" : DAY_NAMES_ID[d.getDay()];
      const fullDate = d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });

      days.push({
        key,
        label: dayLabel,
        fullDate,
        revenue: 0,
        pendingRevenue: 0,
        orderCount: 0,
        unitsSold: 0,
      });
    }

    orders.forEach((order) => {
      const d = new Date(order.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
      const target = days.find((item) => item.key === key);
      if (target) {
        if (order.status !== "cancelled" && order.status !== "rejected") {
          target.orderCount += 1;
          target.unitsSold += order.quantity;
        }
        if (order.status === "verified") {
          target.revenue += order.total_price;
        } else if (
          order.status === "payment_uploaded" ||
          order.status === "pending"
        ) {
          target.pendingRevenue += order.total_price;
        }
      }
    });

    return days;
  }, [orders]);

  const maxMetricValue = useMemo(() => {
    const vals = dailySeries.map((d) =>
      chartMetric === "revenue" ? d.revenue + d.pendingRevenue : d.orderCount
    );
    const rawMax = Math.max(...vals, 1);
    return rawMax;
  }, [dailySeries, chartMetric]);

  const summaryKPIs = useMemo(() => {
    const verified = orders.filter((o) => o.status === "verified");
    const pendingPool = orders.filter(
      (o) => o.status === "pending" || o.status === "payment_uploaded"
    );
    const verifiedSum = verified.reduce((acc, o) => acc + o.total_price, 0);
    const pendingSum = pendingPool.reduce((acc, o) => acc + o.total_price, 0);
    const totalUnitsSold = verified.reduce((acc, o) => acc + o.quantity, 0);
    const avgOrderValue =
      verified.length > 0 ? Math.round(verifiedSum / verified.length) : 0;
    const totalInventoryValue = products.reduce(
      (acc, p) => acc + p.price * p.stock,
      0
    );

    return {
      verifiedSum,
      pendingSum,
      totalUnitsSold,
      avgOrderValue,
      totalInventoryValue,
    };
  }, [orders, products]);

  // SVG Smooth Area Chart coordinates
  const svgWidth = 600;
  const svgHeight = 200;
  const padLeft = 18;
  const padRight = 18;
  const padTop = 20;
  const padBottom = 26;
  const innerW = svgWidth - padLeft - padRight;
  const innerH = svgHeight - padTop - padBottom;

  const primaryPoints = useMemo(() => {
    return dailySeries.map((d, i) => {
      const val =
        chartMetric === "revenue"
          ? d.revenue + d.pendingRevenue
          : d.orderCount;
      const x = padLeft + (innerW / Math.max(dailySeries.length - 1, 1)) * i;
      const ratio = val / maxMetricValue;
      const y = padTop + innerH - ratio * innerH;
      return { x, y, val, day: d };
    });
  }, [dailySeries, chartMetric, maxMetricValue, innerW, innerH]);

  const verifiedPoints = useMemo(() => {
    return dailySeries.map((d, i) => {
      const val = chartMetric === "revenue" ? d.revenue : d.orderCount;
      const x = padLeft + (innerW / Math.max(dailySeries.length - 1, 1)) * i;
      const ratio = val / maxMetricValue;
      const y = padTop + innerH - ratio * innerH;
      return { x, y, val, day: d };
    });
  }, [dailySeries, chartMetric, maxMetricValue, innerW, innerH]);

  const primaryLinePath = buildSmoothPath(primaryPoints);
  const primaryAreaPath =
    primaryPoints.length > 0
      ? `${primaryLinePath} L ${primaryPoints[primaryPoints.length - 1].x} ${
          padTop + innerH
        } L ${primaryPoints[0].x} ${padTop + innerH} Z`
      : "";

  const verifiedLinePath = buildSmoothPath(verifiedPoints);
  const verifiedAreaPath =
    verifiedPoints.length > 0
      ? `${verifiedLinePath} L ${verifiedPoints[verifiedPoints.length - 1].x} ${
          padTop + innerH
        } L ${verifiedPoints[0].x} ${padTop + innerH} Z`
      : "";

  // 2. Order Status Distribution (for SVG Donut Chart)
  const statusBreakdown = useMemo(() => {
    const counts = {
      verified: orders.filter((o) => o.status === "verified").length,
      payment_uploaded: orders.filter((o) => o.status === "payment_uploaded")
        .length,
      pending: orders.filter((o) => o.status === "pending").length,
      other: orders.filter(
        (o) => o.status === "rejected" || o.status === "cancelled"
      ).length,
    };
    const total = orders.length;
    const segments = [
      {
        label: "Terverifikasi Lunas",
        count: counts.verified,
        color: "#D9F36A",
        badgeClass: "bg-loopa-lime",
      },
      {
        label: "Menunggu Verifikasi",
        count: counts.payment_uploaded,
        color: "#FF876F",
        badgeClass: "bg-loopa-coral",
      },
      {
        label: "Menunggu Transfer",
        count: counts.pending,
        color: "#A99AF7",
        badgeClass: "bg-loopa-lavender",
      },
      {
        label: "Ditolak / Batal",
        count: counts.other,
        color: "#D2CABE",
        badgeClass: "bg-stone-300",
      },
    ];
    return { total, segments };
  }, [orders]);

  // 3. Category Breakdown
  const categoryStats = useMemo(() => {
    const map = new Map<
      string,
      {
        category: string;
        pieces: number;
        totalStock: number;
        inventoryValue: number;
        salesValue: number;
      }
    >();

    products.forEach((p) => {
      const existing = map.get(p.category) || {
        category: p.category,
        pieces: 0,
        totalStock: 0,
        inventoryValue: 0,
        salesValue: 0,
      };
      existing.pieces += 1;
      existing.totalStock += p.stock;
      existing.inventoryValue += p.price * p.stock;
      map.set(p.category, existing);
    });

    orders.forEach((o) => {
      if (o.status === "verified" && o.product?.category) {
        const cat = o.product.category;
        const existing = map.get(cat) || {
          category: cat,
          pieces: 0,
          totalStock: 0,
          inventoryValue: 0,
          salesValue: 0,
        };
        existing.salesValue += o.total_price;
        map.set(cat, existing);
      }
    });

    const list = Array.from(map.values()).sort(
      (a, b) =>
        b.salesValue + b.inventoryValue - (a.salesValue + a.inventoryValue)
    );
    const maxVal = Math.max(
      ...list.map((c) => Math.max(c.inventoryValue, c.salesValue)),
      1
    );
    return { list, maxVal };
  }, [products, orders]);

  // 4. Per-Product Performance
  const productPerformance = useMemo(() => {
    return products
      .map((prod) => {
        const prodOrders = orders.filter(
          (o) => o.product_id === prod.id && o.status === "verified"
        );
        const pendingOrders = orders.filter(
          (o) =>
            o.product_id === prod.id &&
            (o.status === "pending" || o.status === "payment_uploaded")
        );
        const unitsSold = prodOrders.reduce((s, o) => s + o.quantity, 0);
        const revenue = prodOrders.reduce((s, o) => s + o.total_price, 0);
        return {
          product: prod,
          unitsSold,
          pendingCount: pendingOrders.length,
          revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue || b.unitsSold - a.unitsSold);
  }, [products, orders]);

  const activeDay =
    hoveredDayIdx !== null ? dailySeries[hoveredDayIdx] : dailySeries[6];

  // SVG Donut math
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="space-y-6">
      {/* ROW 1: Interactive Smooth Area / Line Chart (8 Cols) + Status Donut (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-4xl border-2 border-loopa-charcoal p-5 sm:p-6 shadow-playful flex flex-col justify-between space-y-5">
          {/* Header + Controls */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-loopa-coral" />
                <h3 className="font-display font-black text-sm sm:text-base text-loopa-charcoal">
                  Grafik Kurva Tren Penjualan (7 Hari)
                </h3>
              </div>
              <p className="text-[11px] text-loopa-muted font-semibold mt-0.5">
                Arahkan kursor atau klik titik tanggal untuk melihat rincian harian secara instan.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Chart Style Toggle: Area Curve vs Bar */}
              <div className="inline-flex items-center p-0.5 rounded-full bg-loopa-cream border-2 border-loopa-charcoal">
                <button
                  type="button"
                  onClick={() => setChartType("area")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-colors inline-flex items-center gap-1 ${
                    chartType === "area"
                      ? "bg-loopa-lime text-loopa-charcoal"
                      : "text-loopa-muted hover:text-loopa-charcoal"
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>Kurva</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartType("bar")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-colors inline-flex items-center gap-1 ${
                    chartType === "bar"
                      ? "bg-loopa-lime text-loopa-charcoal"
                      : "text-loopa-muted hover:text-loopa-charcoal"
                  }`}
                >
                  <BarChart3 className="w-3 h-3" />
                  <span>Batang</span>
                </button>
              </div>

              {/* Metric Switcher */}
              <div className="inline-flex items-center p-0.5 rounded-full bg-loopa-cream border-2 border-loopa-charcoal">
                <button
                  type="button"
                  onClick={() => setChartMetric("revenue")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-colors ${
                    chartMetric === "revenue"
                      ? "bg-loopa-charcoal text-white"
                      : "text-loopa-charcoal hover:bg-white"
                  }`}
                >
                  Omzet (Rp)
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric("orders")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-colors ${
                    chartMetric === "orders"
                      ? "bg-loopa-charcoal text-white"
                      : "text-loopa-charcoal hover:bg-white"
                  }`}
                >
                  Order
                </button>
              </div>
            </div>
          </div>

          {/* Live Selected/Hovered Day Readout Banner (Super easy to read!) */}
          <div className="p-3.5 rounded-2xl bg-loopa-cream border border-loopa-charcoal flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-loopa-charcoal text-loopa-lime text-[10px] font-black">
                {activeDay.label} • {activeDay.fullDate}
              </span>
              <span className="font-bold text-loopa-charcoal">
                {activeDay.orderCount} pesanan ({activeDay.unitsSold} pcs)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 font-black text-loopa-charcoal">
                <span className="w-2.5 h-2.5 rounded-full bg-loopa-lime border border-loopa-charcoal" />
                Lunas: {formatCurrency(activeDay.revenue)}
              </span>
              {activeDay.pendingRevenue > 0 && (
                <span className="inline-flex items-center gap-1.5 font-bold text-loopa-muted">
                  <span className="w-2.5 h-2.5 rounded-full bg-loopa-lavender border border-loopa-charcoal" />
                  Pending: {formatCurrency(activeDay.pendingRevenue)}
                </span>
              )}
            </div>
          </div>

          {/* CHART BODY: Smooth Area Line Chart OR Bar Chart */}
          {chartType === "area" ? (
            <div className="w-full pt-1">
              <div className="flex items-stretch gap-2">
                {/* Readable Left Y-Axis Scale */}
                <div className="flex flex-col justify-between text-[10px] font-bold text-loopa-muted py-3 shrink-0 text-right w-14">
                  <span>
                    {chartMetric === "revenue"
                      ? formatCompactRp(maxMetricValue)
                      : `${maxMetricValue} ord`}
                  </span>
                  <span>
                    {chartMetric === "revenue"
                      ? formatCompactRp(Math.round(maxMetricValue / 2))
                      : `${Math.round(maxMetricValue / 2)}`}
                  </span>
                  <span>{chartMetric === "revenue" ? "Rp 0" : "0"}</span>
                </div>

                {/* Responsive SVG Smooth Area Chart */}
                <div className="flex-1 min-w-0">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-48 sm:h-52 overflow-visible"
                    role="img"
                    aria-label="Grafik Kurva Tren Penjualan 7 Hari"
                  >
                    <defs>
                      <linearGradient id="loopaLimeArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D9F36A" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#D9F36A" stopOpacity="0.06" />
                      </linearGradient>
                      <linearGradient id="loopaLavenderArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#A99AF7" stopOpacity="0.45" />
                        <stop offset="100%" stopColor="#A99AF7" stopOpacity="0.04" />
                      </linearGradient>
                    </defs>

                    {/* Dashed Horizontal Reference Grid */}
                    {[0, 0.5, 1].map((t) => {
                      const y = padTop + innerH * t;
                      return (
                        <line
                          key={t}
                          x1={padLeft}
                          y1={y}
                          x2={svgWidth - padRight}
                          y2={y}
                          stroke="#D2CABE"
                          strokeWidth="1"
                          strokeDasharray={t === 1 ? undefined : "4 4"}
                        />
                      );
                    })}

                    {/* Total (Lunas + Pending) Lavender Area when viewing revenue */}
                    {chartMetric === "revenue" && (
                      <>
                        <path d={primaryAreaPath} fill="url(#loopaLavenderArea)" />
                        <path
                          d={primaryLinePath}
                          fill="none"
                          stroke="#A99AF7"
                          strokeWidth="2.5"
                          strokeDasharray="6 4"
                        />
                      </>
                    )}

                    {/* Verified Revenue / Orders Primary Electric Lime Area + Bold Charcoal Line */}
                    <path d={verifiedAreaPath} fill="url(#loopaLimeArea)" />
                    <path
                      d={verifiedLinePath}
                      fill="none"
                      stroke="#242424"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Vertical Hover Guide + Interactive Nodes */}
                    {primaryPoints.map((pt, idx) => {
                      const vPt = verifiedPoints[idx];
                      const isActive =
                        hoveredDayIdx === idx ||
                        (hoveredDayIdx === null && idx === 6);

                      return (
                        <g
                          key={pt.day.key}
                          onMouseEnter={() => setHoveredDayIdx(idx)}
                          onClick={() => setHoveredDayIdx(idx)}
                          className="cursor-pointer"
                        >
                          {/* Invisible wide hit column for effortless hover/tap */}
                          <rect
                            x={pt.x - 32}
                            y={0}
                            width={64}
                            height={svgHeight}
                            fill="transparent"
                          />

                          {/* Vertical crosshair on active day */}
                          {isActive && (
                            <line
                              x1={pt.x}
                              y1={padTop}
                              x2={pt.x}
                              y2={padTop + innerH}
                              stroke="#FF876F"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                            />
                          )}

                          {/* Pending point if higher than verified */}
                          {chartMetric === "revenue" &&
                            pt.day.pendingRevenue > 0 && (
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={isActive ? 5.5 : 4}
                                fill="#A99AF7"
                                stroke="#242424"
                                strokeWidth="2"
                              />
                            )}

                          {/* Primary Verified/Order Point */}
                          <circle
                            cx={vPt.x}
                            cy={vPt.y}
                            r={isActive ? 7 : 5}
                            fill={isActive ? "#FF876F" : "#D9F36A"}
                            stroke="#242424"
                            strokeWidth="2.5"
                          />

                          {/* X-Axis Day Label */}
                          <text
                            x={pt.x}
                            y={svgHeight - 4}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight={isActive ? "900" : "700"}
                            fill={isActive ? "#242424" : "#78716C"}
                          >
                            {pt.day.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            /* Optional Bar Chart Mode */
            <div className="relative pt-3 pb-1">
              <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-48 px-1">
                {dailySeries.map((day, idx) => {
                  const totalVal =
                    chartMetric === "revenue"
                      ? day.revenue + day.pendingRevenue
                      : day.orderCount;
                  const verifiedHeightPct =
                    chartMetric === "revenue"
                      ? Math.round((day.revenue / maxMetricValue) * 100)
                      : Math.round((day.orderCount / maxMetricValue) * 100);
                  const pendingHeightPct =
                    chartMetric === "revenue"
                      ? Math.round((day.pendingRevenue / maxMetricValue) * 100)
                      : 0;
                  const isActive =
                    hoveredDayIdx === idx ||
                    (hoveredDayIdx === null && idx === 6);
                  const hasData = totalVal > 0;

                  return (
                    <div
                      key={day.key}
                      onMouseEnter={() => setHoveredDayIdx(idx)}
                      onClick={() => setHoveredDayIdx(idx)}
                      className="flex flex-col items-center h-full justify-end cursor-pointer"
                    >
                      <span className="text-[10px] font-black text-loopa-charcoal mb-1 truncate max-w-full">
                        {hasData
                          ? chartMetric === "revenue"
                            ? totalVal >= 1000000
                              ? `${(totalVal / 1000000).toFixed(1)}jt`
                              : `${Math.round(totalVal / 1000)}rb`
                            : `${day.orderCount}`
                          : "0"}
                      </span>
                      <div className="w-full max-w-[42px] h-32 bg-loopa-cream rounded-2xl border border-loopa-border flex flex-col justify-end overflow-hidden p-0.5">
                        {hasData ? (
                          <div className="w-full flex flex-col justify-end h-full gap-0.5">
                            {pendingHeightPct > 0 && (
                              <div
                                style={{ height: `${Math.max(pendingHeightPct, 10)}%` }}
                                className="w-full rounded-t-xl bg-loopa-lavender border border-loopa-charcoal"
                              />
                            )}
                            {verifiedHeightPct > 0 && (
                              <div
                                style={{ height: `${Math.max(verifiedHeightPct, 12)}%` }}
                                className={`w-full rounded-xl border-2 border-loopa-charcoal ${
                                  isActive ? "bg-loopa-coral" : "bg-loopa-lime"
                                }`}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-1.5 rounded-full bg-loopa-border/60" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-black mt-2 ${
                          isActive ? "text-loopa-charcoal underline" : "text-loopa-muted"
                        }`}
                      >
                        {day.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t-2 border-loopa-border">
            <div className="p-3 rounded-2xl bg-loopa-cream border border-loopa-charcoal">
              <span className="text-[10px] font-bold text-loopa-muted uppercase block">
                Potensi Omzet Pending
              </span>
              <span className="font-display font-black text-sm text-loopa-charcoal">
                {formatCurrency(summaryKPIs.pendingSum)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-loopa-cream border border-loopa-charcoal">
              <span className="text-[10px] font-bold text-loopa-muted uppercase block">
                Rata-Rata Nilai Order (AOV)
              </span>
              <span className="font-display font-black text-sm text-loopa-charcoal">
                {formatCurrency(summaryKPIs.avgOrderValue)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-loopa-cream border border-loopa-charcoal">
              <span className="text-[10px] font-bold text-loopa-muted uppercase block">
                Total Nilai Stok Etalase
              </span>
              <span className="font-display font-black text-sm text-loopa-charcoal">
                {formatCurrency(summaryKPIs.totalInventoryValue)}
              </span>
            </div>
          </div>
        </div>

        {/* Order Status Distribution SVG Donut */}
        <div className="lg:col-span-4 bg-white rounded-4xl border-2 border-loopa-charcoal p-5 sm:p-6 shadow-playful flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-loopa-coral" />
            <h3 className="font-display font-black text-sm sm:text-base text-loopa-charcoal">
              Proporsi Status Pesanan
            </h3>
          </div>

          <div className="flex items-center justify-center py-2">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="#F7F3EC"
                  strokeWidth="18"
                />
                {statusBreakdown.total > 0 &&
                  statusBreakdown.segments.map((seg) => {
                    if (seg.count === 0) return null;
                    const ratio = seg.count / statusBreakdown.total;
                    const dashLength = ratio * circumference;
                    const dashOffset = -cumulativeOffset;
                    cumulativeOffset += dashLength;

                    return (
                      <circle
                        key={seg.label}
                        cx="70"
                        cy="70"
                        r={radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="18"
                        strokeDasharray={`${dashLength} ${circumference}`}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="butt"
                      />
                    );
                  })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-display font-black text-2xl text-loopa-charcoal leading-none">
                  {statusBreakdown.total}
                </span>
                <span className="text-[10px] font-bold text-loopa-muted uppercase mt-1">
                  Pesanan
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-loopa-border">
            {statusBreakdown.segments.map((seg) => {
              const pct =
                statusBreakdown.total > 0
                  ? Math.round((seg.count / statusBreakdown.total) * 100)
                  : 0;
              return (
                <div
                  key={seg.label}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-3 h-3 rounded-full border border-loopa-charcoal shrink-0 ${seg.badgeClass}`}
                    />
                    <span className="font-bold text-loopa-charcoal truncate">
                      {seg.label}
                    </span>
                  </div>
                  <span className="font-black text-loopa-charcoal shrink-0">
                    {seg.count}{" "}
                    <span className="text-[10px] text-loopa-muted font-semibold">
                      ({pct}%)
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ROW 2: Category Breakdown (6 Cols) + Top Pieces Performance (6 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white rounded-4xl border-2 border-loopa-charcoal p-5 sm:p-6 shadow-playful space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-loopa-coral" />
              <h3 className="font-display font-black text-sm sm:text-base text-loopa-charcoal">
                Nilai Katalog &amp; Penjualan per Kategori
              </h3>
            </div>
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-loopa-cream border border-loopa-charcoal">
              {categoryStats.list.length} Kategori
            </span>
          </div>

          {categoryStats.list.length > 0 ? (
            <div className="space-y-4 pt-1">
              {categoryStats.list.map((cat) => {
                const invPct = Math.max(
                  Math.round((cat.inventoryValue / categoryStats.maxVal) * 100),
                  8
                );
                const salesPct =
                  cat.salesValue > 0
                    ? Math.max(
                        Math.round((cat.salesValue / categoryStats.maxVal) * 100),
                        8
                      )
                    : 0;

                return (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-black text-loopa-charcoal truncate">
                        {cat.category}
                      </span>
                      <span className="text-[11px] font-bold text-loopa-muted shrink-0">
                        {cat.pieces} piece • {cat.totalStock} stok
                      </span>
                    </div>
                    <div className="w-full h-3.5 rounded-full bg-loopa-cream border border-loopa-charcoal overflow-hidden">
                      <div
                        style={{ width: `${invPct}%` }}
                        className="h-full bg-loopa-lavender rounded-full transition-all duration-500"
                      />
                    </div>
                    {salesPct > 0 && (
                      <div className="w-full h-2.5 rounded-full bg-loopa-cream border border-loopa-charcoal overflow-hidden">
                        <div
                          style={{ width: `${salesPct}%` }}
                          className="h-full bg-loopa-lime rounded-full transition-all duration-500"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[10px] font-bold text-loopa-muted">
                      <span>Nilai Stok: {formatCurrency(cat.inventoryValue)}</span>
                      <span className="text-loopa-charcoal font-black">
                        Terjual: {formatCurrency(cat.salesValue)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-loopa-cream border-2 border-dashed border-loopa-charcoal text-center space-y-1">
              <Sparkles className="w-6 h-6 text-loopa-muted mx-auto" />
              <p className="text-xs font-black text-loopa-charcoal">
                Belum Ada Data Kategori
              </p>
              <p className="text-[11px] text-loopa-muted">
                Tambahkan piece pakaian baru untuk melihat grafik analitik kategori.
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-6 bg-white rounded-4xl border-2 border-loopa-charcoal p-5 sm:p-6 shadow-playful space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-loopa-coral" />
              <h3 className="font-display font-black text-sm sm:text-base text-loopa-charcoal">
                Performa Produk &amp; Kesehatan Stok
              </h3>
            </div>
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-loopa-lime border border-loopa-charcoal">
              {summaryKPIs.totalUnitsSold} Unit Terjual
            </span>
          </div>

          {productPerformance.length > 0 ? (
            <div className="space-y-3">
              {productPerformance.slice(0, 4).map((item, idx) => {
                const lowStock = item.product.stock <= 2;
                return (
                  <div
                    key={item.product.id}
                    className="p-3 rounded-2xl bg-loopa-cream border border-loopa-charcoal flex items-center gap-3"
                  >
                    <span className="w-6 h-6 rounded-full bg-loopa-charcoal text-white text-[10px] font-black flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.product.images[0] || ""}
                      alt={item.product.name}
                      className="w-11 h-12 rounded-xl object-cover border border-loopa-charcoal shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display font-bold text-xs text-loopa-charcoal truncate">
                        {item.product.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-black text-loopa-charcoal">
                          {formatCurrency(item.product.price)}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            lowStock
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : "bg-white text-loopa-charcoal border-loopa-charcoal"
                          }`}
                        >
                          {lowStock && (
                            <AlertCircle className="w-2.5 h-2.5 inline mr-0.5" />
                          )}
                          Stok: {item.product.stock}
                        </span>
                        {item.pendingCount > 0 && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-loopa-coral text-white border border-loopa-charcoal">
                            {item.pendingCount} pending
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-loopa-muted block">
                        {item.unitsSold} terjual
                      </span>
                      <span className="text-xs font-black text-loopa-charcoal">
                        {formatCurrency(item.revenue)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-loopa-cream border-2 border-dashed border-loopa-charcoal text-center space-y-1">
              <ShoppingBag className="w-6 h-6 text-loopa-muted mx-auto" />
              <p className="text-xs font-black text-loopa-charcoal">
                Etalase Masih Kosong
              </p>
              <p className="text-[11px] text-loopa-muted">
                Tambahkan piece pakaian baru untuk mulai memantau performa penjualan Anda.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
