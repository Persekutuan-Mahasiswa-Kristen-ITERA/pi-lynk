'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import QRCodeCanvas from '@/components/qr-code';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

interface LinkItem {
  id: number;
  slug: string;
  destinationUrl: string;
  title: string | null;
  status: 'active' | 'inactive' | 'blocked';
  statusReason: string | null;
  isOfficial: boolean;
  createdBy: string | null;
  clickCount: number;
  lastClickedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface ReportItem {
  id: number;
  slugOrUrl: string;
  reason: string;
  contactInfo: string | null;
  status: 'pending' | 'resolved';
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
}

export default function AdminDashboardClient({ adminEmail }: { adminEmail: string }) {
  const [activeTab, setActiveTab] = useState<'links' | 'reports' | 'import'>('links');
  
  // Links state
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [totalLinks, setTotalLinks] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [officialFilter, setOfficialFilter] = useState('');
  const [isLoadingLinks, setIsLoadingLinks] = useState(true);

  // Modal / Action states
  const [selectedQrUrl, setSelectedQrUrl] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // New Official Link Form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSlug, setNewSlug] = useState('');
  const [newDestinationUrl, setNewDestinationUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newExpiresAt, setNewExpiresAt] = useState('');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Reports state
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [reportStatusFilter, setReportStatusFilter] = useState<'pending' | 'resolved'>('pending');
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // Import state
  const [importJson, setImportJson] = useState('');
  const [importResult, setImportResult] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const reloadData = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let ignore = false;

    if (activeTab === 'links') {
      const loadLinks = async () => {
        setIsLoadingLinks(true);
        try {
          const params = new URLSearchParams({
            page: page.toString(),
            limit: '15',
          });
          if (search) params.append('q', search);
          if (statusFilter) params.append('status', statusFilter);
          if (officialFilter) params.append('official', officialFilter);

          const res = await fetch(`/api/admin/links?${params.toString()}`);
          if (res.ok && !ignore) {
            const data = await res.json();
            setLinks(data.items || []);
            setTotalLinks(data.pagination.total);
            setTotalPages(data.pagination.totalPages);
          }
        } catch (err) {
          console.error('Failed to load links:', err);
        } finally {
          if (!ignore) {
            setIsLoadingLinks(false);
          }
        }
      };
      loadLinks();
    } else if (activeTab === 'reports') {
      const loadReports = async () => {
        setIsLoadingReports(true);
        try {
          const res = await fetch(`/api/admin/reports?status=${reportStatusFilter}`);
          if (res.ok && !ignore) {
            const data = await res.json();
            setReports(data.items || []);
          }
        } catch (err) {
          console.error('Failed to load reports:', err);
        } finally {
          if (!ignore) {
            setIsLoadingReports(false);
          }
        }
      };
      loadReports();
    }

    return () => {
      ignore = true;
    };
  }, [activeTab, page, search, statusFilter, officialFilter, reportStatusFilter, refreshKey]);

  // Copy shortlink helper
  const handleCopy = (link: LinkItem) => {
    const fullUrl = `${BASE_URL}/${link.slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Create Official Link
  const handleCreateOfficialLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setIsCreating(true);

    try {
      const res = await fetch('/api/admin/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newSlug,
          destinationUrl: newDestinationUrl,
          title: newTitle || undefined,
          isOfficial: true,
          expiresAt: newExpiresAt || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || 'Gagal membuat tautan resmi.');
        return;
      }

      setShowCreateModal(false);
      setNewSlug('');
      setNewDestinationUrl('');
      setNewTitle('');
      setNewExpiresAt('');
      reloadData();
    } catch {
      setCreateError('Gagal menghubungi server.');
    } finally {
      setIsCreating(false);
    }
  };

  // Update Link
  const handleUpdateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;

    try {
      const res = await fetch(`/api/admin/links/${editingLink.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationUrl: editingLink.destinationUrl,
          title: editingLink.title,
          status: editingLink.status,
          statusReason: editingLink.statusReason,
          isOfficial: editingLink.isOfficial,
          expiresAt: editingLink.expiresAt || null,
        }),
      });

      if (res.ok) {
        setEditingLink(null);
        reloadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menyimpan perubahan.');
      }
    } catch {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  // Delete Link
  const handleDeleteLink = async (id: number, slug: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus tautan "/${slug}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/links/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        reloadData();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menghapus tautan.');
      }
    } catch {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  // Resolve Report
  const handleResolveReport = async (reportId: number) => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });
      if (res.ok) {
        reloadData();
      }
    } catch {
      alert('Gagal memperbarui status laporan.');
    }
  };

  // Import JSON
  const handleImport = async () => {
    setImportResult(null);
    setIsImporting(true);

    try {
      let parsed;
      try {
        parsed = JSON.parse(importJson);
      } catch {
        setImportResult('Format JSON tidak valid. Pastikan format array JSON benar.');
        setIsImporting(false);
        return;
      }

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      const data = await res.json();
      if (res.ok) {
        setImportResult(data.message);
        setImportJson('');
        reloadData();
      } else {
        setImportResult(`Error: ${data.error || 'Gagal mengimpor data.'}`);
      }
    } catch {
      setImportResult('Terjadi kesalahan jaringan.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-gray-900 flex flex-col">
      {/* Admin Top Navigation */}
      <header className="bg-brown-900 text-white sticky top-0 z-40 shadow-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo-pmk.png"
                alt="Logo PMK ITERA"
                width={36}
                height={36}
                className="rounded-full brightness-200"
              />
              <span className="font-serif font-bold text-lg tracking-wide">
                PI-LYNK <span className="text-xs uppercase bg-brown-800 text-brown-200 px-2 py-0.5 rounded font-mono ml-1">Admin</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4 text-xs sm:text-sm">
            <span className="text-brown-300 hidden md:inline truncate max-w-xs">
              {adminEmail}
            </span>
            <Link
              href="/"
              className="text-brown-200 hover:text-white transition-colors"
            >
              Lihat Situs
            </Link>
            <Link
              href="/api/auth/signout"
              className="px-3 py-1.5 rounded bg-brown-800 hover:bg-brown-700 text-brown-200 hover:text-white transition-colors"
            >
              Keluar
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-brown-200 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('links')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'links'
                  ? 'bg-brown-800 text-white shadow-sm'
                  : 'bg-white text-brown-700 hover:bg-brown-100'
              }`}
            >
              Daftar Tautan ({totalLinks})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'reports'
                  ? 'bg-brown-800 text-white shadow-sm'
                  : 'bg-white text-brown-700 hover:bg-brown-100'
              }`}
            >
              Laporan Abuse
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'import'
                  ? 'bg-brown-800 text-white shadow-sm'
                  : 'bg-white text-brown-700 hover:bg-brown-100'
              }`}
            >
              Impor Tautan Lama
            </button>
          </div>

          {activeTab === 'links' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brown-700 hover:bg-brown-800 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Buat Tautan Resmi
            </button>
          )}
        </div>

        {/* Tab 1: Links View */}
        {activeTab === 'links' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-brown-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="w-full md:w-80">
                <input
                  type="text"
                  placeholder="Cari slug, judul, atau URL..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 text-sm border border-brown-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brown-600"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 text-sm border border-brown-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brown-600 bg-white"
                >
                  <option value="">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                  <option value="blocked">Diblokir</option>
                </select>

                <select
                  value={officialFilter}
                  onChange={(e) => {
                    setOfficialFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 text-sm border border-brown-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brown-600 bg-white"
                >
                  <option value="">Semua Jenis</option>
                  <option value="true">Hanya Resmi</option>
                  <option value="false">Hanya Publik</option>
                </select>
              </div>
            </div>

            {/* Links Table */}
            <div className="bg-white rounded-xl border border-brown-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-brown-50 border-b border-brown-200 text-brown-900 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Slug / Shortlink</th>
                      <th className="py-3 px-4">Tujuan</th>
                      <th className="py-3 px-4">Jenis</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Klik</th>
                      <th className="py-3 px-4">Dibuat</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brown-100">
                    {isLoadingLinks ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-brown-500">
                          Memuat data tautan...
                        </td>
                      </tr>
                    ) : links.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-brown-500">
                          Tidak ada tautan yang sesuai filter.
                        </td>
                      </tr>
                    ) : (
                      links.map((link) => (
                        <tr key={link.id} className="hover:bg-brown-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-mono font-medium text-brown-900">
                              /{link.slug}
                            </div>
                            {link.title && (
                              <div className="text-xs text-brown-600 font-sans truncate max-w-xs">
                                {link.title}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <a
                              href={link.destinationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brown-700 hover:text-brown-900 underline truncate block text-xs"
                              title={link.destinationUrl}
                            >
                              {link.destinationUrl}
                            </a>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {link.isOfficial ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                Resmi
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                                Publik
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {link.status === 'active' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                Aktif
                              </span>
                            )}
                            {link.status === 'inactive' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200" title={link.statusReason || ''}>
                                Nonaktif
                              </span>
                            )}
                            {link.status === 'blocked' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200" title={link.statusReason || ''}>
                                Diblokir
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-xs">
                            {link.clickCount}
                          </td>
                          <td className="py-3 px-4 text-xs text-brown-600 whitespace-nowrap">
                            {new Date(link.createdAt).toLocaleDateString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {/* Copy */}
                              <button
                                onClick={() => handleCopy(link)}
                                title="Salin Shortlink"
                                className="p-1.5 text-brown-600 hover:text-brown-900 hover:bg-brown-100 rounded"
                              >
                                {copiedId === link.id ? (
                                  <span className="text-xs text-green-600 font-bold">✓</span>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                )}
                              </button>

                              {/* QR */}
                              <button
                                onClick={() => setSelectedQrUrl(`${BASE_URL}/${link.slug}`)}
                                title="Lihat & Unduh QR"
                                className="p-1.5 text-brown-600 hover:text-brown-900 hover:bg-brown-100 rounded"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => setEditingLink(link)}
                                title="Edit Moderasi"
                                className="p-1.5 text-brown-600 hover:text-brown-900 hover:bg-brown-100 rounded"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteLink(link.id, link.slug)}
                                title="Hapus Permanen"
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-brown-200 flex items-center justify-between text-sm">
                  <span className="text-brown-600 text-xs">
                    Halaman {page} dari {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 border border-brown-300 rounded text-xs disabled:opacity-50"
                    >
                      Sebelumnya
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-3 py-1.5 border border-brown-300 rounded text-xs disabled:opacity-50"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Reports View */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setReportStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  reportStatusFilter === 'pending'
                    ? 'bg-red-700 text-white'
                    : 'bg-white text-brown-700 border border-brown-200'
                }`}
              >
                Menunggu Penanganan (Pending)
              </button>
              <button
                onClick={() => setReportStatusFilter('resolved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  reportStatusFilter === 'resolved'
                    ? 'bg-green-700 text-white'
                    : 'bg-white text-brown-700 border border-brown-200'
                }`}
              >
                Telah Ditangani (Resolved)
              </button>
            </div>

            <div className="bg-white rounded-xl border border-brown-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-brown-50 border-b border-brown-200 text-brown-900 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Tautan Dilaporkan</th>
                    <th className="py-3 px-4">Alasan</th>
                    <th className="py-3 px-4">Kontak</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown-100">
                  {isLoadingReports ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-brown-500">
                        Memuat data laporan...
                      </td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-brown-500">
                        Tidak ada laporan dalam status ini.
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id} className="hover:bg-brown-50/50">
                        <td className="py-3 px-4 font-mono text-xs font-medium text-red-700">
                          {report.slugOrUrl}
                        </td>
                        <td className="py-3 px-4 text-brown-800 text-xs max-w-sm">
                          {report.reason}
                        </td>
                        <td className="py-3 px-4 text-brown-600 text-xs">
                          {report.contactInfo || '-'}
                        </td>
                        <td className="py-3 px-4 text-brown-600 text-xs whitespace-nowrap">
                          {new Date(report.createdAt).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {report.status === 'pending' ? (
                            <button
                              onClick={() => handleResolveReport(report.id)}
                              className="px-3 py-1 bg-green-700 hover:bg-green-800 text-white text-xs font-medium rounded shadow-sm"
                            >
                              Tandai Selesai
                            </button>
                          ) : (
                            <span className="text-xs text-green-700">
                              Diselesaikan oleh {report.resolvedBy || 'admin'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Import View */}
        {activeTab === 'import' && (
          <div className="bg-white rounded-xl border border-brown-200 p-6 shadow-sm max-w-3xl">
            <h2 className="font-serif font-bold text-xl text-brown-900 mb-2">
              Impor Tautan Lama (JSON)
            </h2>
            <p className="text-sm text-brown-600 mb-4">
              Tempelkan payload JSON berisi daftar shortlink dari sistem lama untuk dipindahkan secara massal ke basis data PI-LYNK.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-brown-700 mb-1">
                Contoh Format:
              </label>
              <pre className="p-3 bg-brown-50 rounded border border-brown-200 text-xs font-mono text-brown-800 overflow-x-auto">
{`[
  { "slug": "natal-2025", "destinationUrl": "https://pmkitera.web.id/event/natal", "title": "Perayaan Natal" },
  { "slug": "retreat", "destinationUrl": "https://forms.gle/xyz", "title": "Formulir Retreat" }
]`}
              </pre>
            </div>

            <textarea
              rows={8}
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Tempel JSON array di sini..."
              className="w-full p-3 font-mono text-xs border border-brown-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brown-600 mb-4"
            />

            {importResult && (
              <div className="p-3 bg-brown-50 border border-brown-200 rounded-lg text-sm mb-4 text-brown-800 font-medium">
                {importResult}
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={isImporting || !importJson.trim()}
              className="px-6 py-2.5 bg-brown-700 hover:bg-brown-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isImporting ? 'Mengimpor...' : 'Mulai Impor Tautan'}
            </button>
          </div>
        )}
      </div>

      {/* Modal: Create Official Link */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-brown-200">
            <h3 className="font-serif font-bold text-xl text-brown-900 mb-4">
              Buat Tautan Resmi PMK ITERA
            </h3>

            <form onSubmit={handleCreateOfficialLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brown-800 mb-1">
                  Custom Slug (Boleh Menggunakan Kata Kunci Resmi) *
                </label>
                <div className="flex border border-brown-300 rounded-lg overflow-hidden">
                  <span className="px-3 py-2 bg-brown-50 text-xs font-mono text-brown-600 border-r border-brown-200">
                    {BASE_URL}/
                  </span>
                  <input
                    type="text"
                    required
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value.toLowerCase())}
                    placeholder="pmk-itera-resmi"
                    className="flex-1 px-3 py-2 text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brown-800 mb-1">
                  URL Tujuan *
                </label>
                <input
                  type="url"
                  required
                  value={newDestinationUrl}
                  onChange={(e) => setNewDestinationUrl(e.target.value)}
                  placeholder="https://pmkitera.web.id/..."
                  className="w-full px-3 py-2 text-sm border border-brown-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brown-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brown-800 mb-1">
                  Judul / Keterangan Tautan (Opsional)
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Formulir Pendaftaran Paskah 2026"
                  className="w-full px-3 py-2 text-sm border border-brown-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brown-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brown-800 mb-1">
                  Tanggal Kedaluwarsa (Opsional)
                </label>
                <input
                  type="datetime-local"
                  value={newExpiresAt}
                  onChange={(e) => setNewExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-brown-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brown-600"
                />
              </div>

              {createError && (
                <div className="p-2.5 bg-red-50 text-red-700 rounded text-xs border border-red-200">
                  {createError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-brown-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-brown-300 rounded-lg text-sm text-brown-700 hover:bg-brown-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-brown-700 hover:bg-brown-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isCreating ? 'Menyimpan...' : 'Simpan Tautan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Link */}
      {editingLink && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-brown-200">
            <h3 className="font-serif font-bold text-xl text-brown-900 mb-1">
              Moderasi Tautan /{editingLink.slug}
            </h3>
            <p className="text-xs text-brown-500 mb-4">
              Edit properti dan status tautan ini secara langsung.
            </p>

            <form onSubmit={handleUpdateLink} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brown-800 mb-1">
                  URL Tujuan
                </label>
                <input
                  type="url"
                  required
                  value={editingLink.destinationUrl}
                  onChange={(e) => setEditingLink({ ...editingLink, destinationUrl: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-brown-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brown-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brown-800 mb-1">
                  Judul / Label
                </label>
                <input
                  type="text"
                  value={editingLink.title || ''}
                  onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-brown-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brown-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brown-800 mb-1">
                  Status Tautan
                </label>
                <select
                  value={editingLink.status}
                  onChange={(e) => setEditingLink({ ...editingLink, status: e.target.value as 'active' | 'inactive' | 'blocked' })}
                  className="w-full px-3 py-2 text-sm border border-brown-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brown-600 bg-white"
                >
                  <option value="active">Aktif (Dapat diakses)</option>
                  <option value="inactive">Nonaktif (Menampilkan 410 Alasan)</option>
                  <option value="blocked">Diblokir (Pelanggaran Ketentuan)</option>
                </select>
              </div>

              {editingLink.status !== 'active' && (
                <div>
                  <label className="block text-xs font-semibold text-brown-800 mb-1">
                    Alasan Nonaktif / Diblokir
                  </label>
                  <input
                    type="text"
                    value={editingLink.statusReason || ''}
                    onChange={(e) => setEditingLink({ ...editingLink, statusReason: e.target.value })}
                    placeholder="Contoh: Kegiatan sudah selesai atau Tautan terindikasi phising"
                    className="w-full px-3 py-2 text-sm border border-brown-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brown-600"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isOfficialCheckbox"
                  checked={editingLink.isOfficial}
                  onChange={(e) => setEditingLink({ ...editingLink, isOfficial: e.target.checked })}
                  className="rounded text-brown-700 focus:ring-brown-600"
                />
                <label htmlFor="isOfficialCheckbox" className="text-xs font-medium text-brown-800">
                  Tandai sebagai Tautan Resmi PMK ITERA
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-brown-100">
                <button
                  type="button"
                  onClick={() => setEditingLink(null)}
                  className="px-4 py-2 border border-brown-300 rounded-lg text-sm text-brown-700 hover:bg-brown-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brown-700 hover:bg-brown-800 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: QR Code Preview & Download */}
      {selectedQrUrl && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-brown-200 text-center">
            <h3 className="font-serif font-bold text-lg text-brown-900 mb-1">
              QR Code Tautan
            </h3>
            <p className="text-xs font-mono text-brown-600 mb-4 truncate">
              {selectedQrUrl}
            </p>

            <div className="mb-4">
              <QRCodeCanvas url={selectedQrUrl} size={220} />
            </div>

            <button
              onClick={() => setSelectedQrUrl(null)}
              className="mt-2 w-full py-2 border border-brown-300 text-brown-700 rounded-lg text-sm font-medium hover:bg-brown-50"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
