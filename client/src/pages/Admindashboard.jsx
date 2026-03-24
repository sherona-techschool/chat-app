// import React, { useState, useEffect, useCallback } from 'react';

// // ─────────────────────────────────────────────────────────────────────────────
// // AdminDashboard
// // Standalone page — add a route in App.jsx:
// //   <Route path="/admin" element={<AdminDashboard />} />
// //
// // Requires .env:  VITE_ADMIN_SECRET=your-secret-here
// // ─────────────────────────────────────────────────────────────────────────────

// const API           = import.meta.env.VITE_API_URL;
// const ADMIN_SECRET  = import.meta.env.VITE_ADMIN_SECRET || '';
// const HEADERS       = { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET };

// // ── Tiny bar-chart drawn with divs — no library needed ────────────────────
// const BarChart = ({ data, color, label }) => {
//     const max = Math.max(...data.map(d => d.count), 1);
//     return (
//         <div style={cs.chartWrap}>
//             <p style={cs.chartLabel}>{label}</p>
//             <div style={cs.bars}>
//                 {data.map((d, i) => (
//                     <div key={i} style={cs.barCol}>
//                         <div style={{ ...cs.bar, height: `${(d.count / max) * 100}%`, background: color }} title={`${d.count}`}>
//                             {d.count > 0 && <span style={cs.barVal}>{d.count}</span>}
//                         </div>
//                         <span style={cs.barDate}>{d.date}</span>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// // ── Stat card ─────────────────────────────────────────────────────────────
// const StatCard = ({ icon, label, value, sub, color, pulse }) => (
//     <div style={{ ...cs.card, borderTop: `3px solid ${color}` }}>
//         <div style={{ ...cs.cardIcon, background: color + '18', color }}>{icon}</div>
//         <div style={cs.cardBody}>
//             <p style={cs.cardLabel}>{label}</p>
//             <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
//                 <h2 style={cs.cardValue}>{value ?? '—'}</h2>
//                 {pulse && <span style={cs.pulseDot} />}
//             </div>
//             {sub && <p style={cs.cardSub}>{sub}</p>}
//         </div>
//     </div>
// );

// // ─────────────────────────────────────────────────────────────────────────────
// export default function AdminDashboard() {
//     const [tab,        setTab]        = useState('overview');   // overview | users | calls
//     const [stats,      setStats]      = useState(null);
//     const [users,      setUsers]      = useState([]);
//     const [calls,      setCalls]      = useState([]);
//     const [usersTotal, setUsersTotal] = useState(0);
//     const [usersPage,  setUsersPage]  = useState(1);
//     const [userPages,  setUserPages]  = useState(1);
//     const [search,     setSearch]     = useState('');
//     const [loading,    setLoading]    = useState(true);
//     const [error,      setError]      = useState('');
//     const [lastRefresh,setLastRefresh]= useState(new Date());

//     // ── Fetch stats ────────────────────────────────────────────────────────
//     const fetchStats = useCallback(async () => {
//         try {
//             const res  = await fetch(`${API}/api/admin/stats`, { headers: HEADERS });
//             if (!res.ok) throw new Error('Unauthorized or server error');
//             const data = await res.json();
//             setStats(data);
//             setLastRefresh(new Date());
//         } catch (e) { setError(e.message); }
//     }, []);

//     // ── Fetch users ────────────────────────────────────────────────────────
//     const fetchUsers = useCallback(async (page = 1, q = '') => {
//         try {
//             const res  = await fetch(
//                 `${API}/api/admin/users?page=${page}&limit=8&search=${encodeURIComponent(q)}`,
//                 { headers: HEADERS }
//             );
//             const data = await res.json();
//             setUsers(data.users || []);
//             setUsersTotal(data.total || 0);
//             setUserPages(data.totalPages || 1);
//         } catch (e) { setError(e.message); }
//     }, []);

//     // ── Fetch calls ────────────────────────────────────────────────────────
//     const fetchCalls = useCallback(async () => {
//         try {
//             const res  = await fetch(`${API}/api/admin/calls?limit=20`, { headers: HEADERS });
//             const data = await res.json();
//             setCalls(data || []);
//         } catch (e) { setError(e.message); }
//     }, []);

//     // Initial load
//     useEffect(() => {
//         (async () => {
//             setLoading(true);
//             await Promise.all([fetchStats(), fetchUsers(), fetchCalls()]);
//             setLoading(false);
//         })();
//     }, []);

//     // Re-fetch users when page or search changes
//     useEffect(() => { fetchUsers(usersPage, search); }, [usersPage, search]);

//     // Auto-refresh stats every 30s
//     useEffect(() => {
//         const id = setInterval(fetchStats, 30_000);
//         return () => clearInterval(id);
//     }, [fetchStats]);

//     const fmtTime = d => new Date(d).toLocaleString();

//     if (loading) return (
//         <div style={cs.loader}>
//             <div style={cs.spinner} />
//             <p style={{ color: '#94a3b8', marginTop: 16 }}>Loading dashboard...</p>
//         </div>
//     );

//     if (error) return (
//         <div style={cs.loader}>
//             <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
//             <p style={{ color: '#ef4444', fontWeight: 600 }}>{error}</p>
//             <p style={{ color: '#94a3b8', fontSize: 13 }}>
//                 Check VITE_ADMIN_SECRET in your .env matches ADMIN_SECRET on the server.
//             </p>
//         </div>
//     );

//     return (
//         <div style={cs.root}>

//             {/* ── Sidebar ── */}
//             <aside style={cs.sidebar}>
//                 <div style={cs.logo}>
//                     <span style={cs.logoIcon}>⚡</span>
//                     <div>
//                         <p style={cs.logoTitle}>ConnectApp</p>
//                         <p style={cs.logoSub}>Admin Panel</p>
//                     </div>
//                 </div>

//                 {[
//                     { id: 'overview', icon: '▦',  label: 'Overview'  },
//                     { id: 'users',    icon: '👥', label: 'Users'     },
//                     { id: 'calls',    icon: '📞', label: 'Call Logs' },
//                 ].map(item => (
//                     <div
//                         key={item.id}
//                         style={{ ...cs.navItem, ...(tab === item.id ? cs.navActive : {}) }}
//                         onClick={() => setTab(item.id)}
//                     >
//                         <span style={cs.navIcon}>{item.icon}</span>
//                         {item.label}
//                     </div>
//                 ))}

//                 <div style={cs.sidebarBottom}>
//                     <p style={cs.refreshedAt}>
//                         Refreshed {lastRefresh.toLocaleTimeString()}
//                     </p>
//                     <button style={cs.refreshBtn} onClick={fetchStats}>↺ Refresh</button>
//                 </div>
//             </aside>

//             {/* ── Main ── */}
//             <main style={cs.main}>

//                 {/* ════════════ OVERVIEW TAB ════════════ */}
//                 {tab === 'overview' && (
//                     <>
//                         <h1 style={cs.pageTitle}>Dashboard Overview</h1>
//                         <p style={cs.pageSub}>Real-time stats for ConnectApp</p>

//                         {/* Stat cards */}
//                         <div style={cs.cardGrid}>
//                             <StatCard
//                                 icon="👤" label="Total Users"
//                                 value={stats.totalUsers}
//                                 sub={`+${stats.newUsersToday} today · +${stats.newUsersWeek} this week`}
//                                 color="#0066ff"
//                             />
//                             <StatCard
//                                 icon="🟢" label="Active Users (Online)"
//                                 value={stats.activeUsers}
//                                 sub={`${stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total users`}
//                                 color="#10b981"
//                                 pulse
//                             />
//                             <StatCard
//                                 icon="📹" label="Total Video Calls"
//                                 value={stats.totalVideoCalls}
//                                 sub={`${stats.totalCalls} total calls`}
//                                 color="#6366f1"
//                             />
//                             <StatCard
//                                 icon="📞" label="Total Audio Calls"
//                                 value={stats.totalAudioCalls}
//                                 sub={`${stats.totalCalls} total calls`}
//                                 color="#f59e0b"
//                             />
//                         </div>

//                         {/* Charts */}
//                         <div style={cs.chartGrid}>
//                             {stats.registrationTrend?.length > 0 && (
//                                 <BarChart
//                                     data={stats.registrationTrend}
//                                     color="#0066ff"
//                                     label="New Registrations — Last 7 Days"
//                                 />
//                             )}
//                             {stats.callsTrend?.length > 0 && (
//                                 <BarChart
//                                     data={stats.callsTrend}
//                                     color="#6366f1"
//                                     label="Calls — Last 7 Days"
//                                 />
//                             )}
//                         </div>

//                         {/* Call type breakdown */}
//                         <div style={cs.breakdownCard}>
//                             <h3 style={cs.sectionTitle}>Call Type Breakdown</h3>
//                             <div style={cs.breakdownRow}>
//                                 <div style={cs.breakdownItem}>
//                                     <span style={{ ...cs.breakdownDot, background: '#6366f1' }} />
//                                     <span style={cs.breakdownLabel}>Video Calls</span>
//                                     <span style={cs.breakdownCount}>{stats.totalVideoCalls}</span>
//                                     <div style={cs.breakdownBarWrap}>
//                                         <div style={{
//                                             ...cs.breakdownBar,
//                                             width: stats.totalCalls > 0
//                                                 ? `${(stats.totalVideoCalls / stats.totalCalls) * 100}%`
//                                                 : '0%',
//                                             background: '#6366f1',
//                                         }} />
//                                     </div>
//                                 </div>
//                                 <div style={cs.breakdownItem}>
//                                     <span style={{ ...cs.breakdownDot, background: '#f59e0b' }} />
//                                     <span style={cs.breakdownLabel}>Audio Calls</span>
//                                     <span style={cs.breakdownCount}>{stats.totalAudioCalls}</span>
//                                     <div style={cs.breakdownBarWrap}>
//                                         <div style={{
//                                             ...cs.breakdownBar,
//                                             width: stats.totalCalls > 0
//                                                 ? `${(stats.totalAudioCalls / stats.totalCalls) * 100}%`
//                                                 : '0%',
//                                             background: '#f59e0b',
//                                         }} />
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </>
//                 )}

//                 {/* ════════════ USERS TAB ════════════ */}
//                 {tab === 'users' && (
//                     <>
//                         <div style={cs.tabHeader}>
//                             <div>
//                                 <h1 style={cs.pageTitle}>User Management</h1>
//                                 <p style={cs.pageSub}>{usersTotal} total users registered</p>
//                             </div>
//                             <input
//                                 style={cs.searchBox}
//                                 placeholder="🔍  Search by name, email or username..."
//                                 value={search}
//                                 onChange={e => { setSearch(e.target.value); setUsersPage(1); }}
//                             />
//                         </div>

//                         <div style={cs.tableWrap}>
//                             <table style={cs.table}>
//                                 <thead>
//                                     <tr style={cs.thead}>
//                                         <th style={cs.th}>User</th>
//                                         <th style={cs.th}>Email</th>
//                                         <th style={cs.th}>Username</th>
//                                         <th style={cs.th}>Status</th>
//                                         <th style={cs.th}>Joined</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {users.map(u => (
//                                         <tr key={u._id} style={cs.tr}>
//                                             <td style={cs.td}>
//                                                 <div style={cs.userCell}>
//                                                     <div style={cs.tableAvatar}>
//                                                         {u.fullName?.charAt(0).toUpperCase() || '?'}
//                                                     </div>
//                                                     <span style={{ fontWeight: 600, color: '#1e293b' }}>
//                                                         {u.fullName || '—'}
//                                                     </span>
//                                                 </div>
//                                             </td>
//                                             <td style={{ ...cs.td, color: '#64748b' }}>{u.email}</td>
//                                             <td style={{ ...cs.td, color: '#64748b' }}>@{u.username}</td>
//                                             <td style={cs.td}>
//                                                 <span style={{
//                                                     ...cs.badge,
//                                                     background: u.status === 'online' ? '#dcfce7' : '#f1f5f9',
//                                                     color:      u.status === 'online' ? '#16a34a' : '#64748b',
//                                                 }}>
//                                                     {u.status === 'online' ? '● Online' : '○ Offline'}
//                                                 </span>
//                                             </td>
//                                             <td style={{ ...cs.td, color: '#94a3b8', fontSize: 13 }}>
//                                                 {new Date(u.createdAt).toLocaleDateString()}
//                                             </td>
//                                         </tr>
//                                     ))}
//                                     {users.length === 0 && (
//                                         <tr><td colSpan={5} style={{ ...cs.td, textAlign:'center', color:'#94a3b8', padding:32 }}>No users found</td></tr>
//                                     )}
//                                 </tbody>
//                             </table>
//                         </div>

//                         {/* Pagination */}
//                         <div style={cs.pagination}>
//                             <span style={{ color: '#64748b', fontSize: 14 }}>
//                                 Page {usersPage} of {userPages}
//                             </span>
//                             <div style={{ display:'flex', gap:8 }}>
//                                 <button
//                                     style={{ ...cs.pageBtn, opacity: usersPage <= 1 ? 0.4 : 1 }}
//                                     onClick={() => setUsersPage(p => Math.max(p - 1, 1))}
//                                     disabled={usersPage <= 1}
//                                 >← Prev</button>
//                                 <button
//                                     style={{ ...cs.pageBtn, opacity: usersPage >= userPages ? 0.4 : 1 }}
//                                     onClick={() => setUsersPage(p => Math.min(p + 1, userPages))}
//                                     disabled={usersPage >= userPages}
//                                 >Next →</button>
//                             </div>
//                         </div>
//                     </>
//                 )}

//                 {/* ════════════ CALLS TAB ════════════ */}
//                 {tab === 'calls' && (
//                     <>
//                         <h1 style={cs.pageTitle}>Call Logs</h1>
//                         <p style={cs.pageSub}>Last 20 calls across all users</p>

//                         <div style={cs.tableWrap}>
//                             <table style={cs.table}>
//                                 <thead>
//                                     <tr style={cs.thead}>
//                                         <th style={cs.th}>Type</th>
//                                         <th style={cs.th}>From</th>
//                                         <th style={cs.th}>To</th>
//                                         <th style={cs.th}>Duration</th>
//                                         <th style={cs.th}>Time</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {calls.map(c => (
//                                         <tr key={c._id} style={cs.tr}>
//                                             <td style={cs.td}>
//                                                 <span style={{
//                                                     ...cs.badge,
//                                                     background: c.type === 'video_call' ? '#ede9fe' : '#fef3c7',
//                                                     color:      c.type === 'video_call' ? '#6366f1' : '#d97706',
//                                                 }}>
//                                                     {c.type === 'video_call' ? '📹 Video' : '📞 Audio'}
//                                                 </span>
//                                             </td>
//                                             <td style={cs.td}>
//                                                 <div style={{ fontWeight: 600, color: '#1e293b' }}>
//                                                     {c.sender?.fullName || '—'}
//                                                 </div>
//                                                 <div style={{ fontSize: 12, color: '#94a3b8' }}>
//                                                     {c.sender?.email}
//                                                 </div>
//                                             </td>
//                                             <td style={cs.td}>
//                                                 <div style={{ fontWeight: 600, color: '#1e293b' }}>
//                                                     {c.receiver?.fullName || '—'}
//                                                 </div>
//                                                 <div style={{ fontSize: 12, color: '#94a3b8' }}>
//                                                     {c.receiver?.email}
//                                                 </div>
//                                             </td>
//                                             <td style={cs.td}>
//                                                 <span style={{ color: '#64748b' }}>
//                                                     {c.callDuration > 0
//                                                         ? `${Math.floor(c.callDuration / 60)}m ${c.callDuration % 60}s`
//                                                         : 'Missed / 0s'}
//                                                 </span>
//                                             </td>
//                                             <td style={{ ...cs.td, color: '#94a3b8', fontSize: 13 }}>
//                                                 {fmtTime(c.createdAt)}
//                                             </td>
//                                         </tr>
//                                     ))}
//                                     {calls.length === 0 && (
//                                         <tr><td colSpan={5} style={{ ...cs.td, textAlign:'center', color:'#94a3b8', padding:32 }}>No call logs found</td></tr>
//                                     )}
//                                 </tbody>
//                             </table>
//                         </div>
//                     </>
//                 )}
//             </main>
//         </div>
//     );
// }

// // ── Styles ────────────────────────────────────────────────────────────────────
// const cs = {
//     root:       { display:'flex', minHeight:'100vh', background:'#f8fafc', fontFamily:"'Segoe UI', system-ui, sans-serif" },

//     // Sidebar
//     sidebar:    { width:220, background:'#0f172a', display:'flex', flexDirection:'column', padding:'24px 0', flexShrink:0, position:'sticky', top:0, height:'100vh' },
//     logo:       { display:'flex', alignItems:'center', gap:12, padding:'0 20px 28px', borderBottom:'1px solid rgba(255,255,255,0.08)', marginBottom:12 },
//     logoIcon:   { fontSize:24 },
//     logoTitle:  { margin:0, color:'#fff', fontWeight:700, fontSize:15 },
//     logoSub:    { margin:0, color:'#94a3b8', fontSize:11 },
//     navItem:    { display:'flex', alignItems:'center', gap:10, padding:'11px 20px', cursor:'pointer', color:'#94a3b8', fontSize:14, fontWeight:500, transition:'all .15s', borderLeft:'3px solid transparent' },
//     navActive:  { color:'#fff', background:'rgba(255,255,255,0.06)', borderLeft:'3px solid #0066ff' },
//     navIcon:    { fontSize:16, width:20, textAlign:'center' },
//     sidebarBottom: { marginTop:'auto', padding:'20px', borderTop:'1px solid rgba(255,255,255,0.08)' },
//     refreshedAt:{ color:'#475569', fontSize:11, margin:'0 0 8px' },
//     refreshBtn: { width:'100%', padding:'8px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', borderRadius:8, cursor:'pointer', fontSize:13 },

//     // Main
//     main:       { flex:1, padding:'32px 36px', overflowY:'auto' },
//     pageTitle:  { margin:'0 0 4px', fontSize:26, fontWeight:800, color:'#0f172a' },
//     pageSub:    { margin:'0 0 28px', color:'#64748b', fontSize:14 },
//     tabHeader:  { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, gap:16, flexWrap:'wrap' },

//     // Stat cards
//     cardGrid:   { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:20, marginBottom:28 },
//     card:       { background:'#fff', borderRadius:14, padding:'20px', display:'flex', gap:16, alignItems:'flex-start', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
//     cardIcon:   { width:44, height:44, borderRadius:10, display:'flex', justifyContent:'center', alignItems:'center', fontSize:20, flexShrink:0 },
//     cardBody:   { flex:1 },
//     cardLabel:  { margin:'0 0 4px', fontSize:13, color:'#64748b', fontWeight:500 },
//     cardValue:  { margin:0, fontSize:32, fontWeight:800, color:'#0f172a', lineHeight:1 },
//     cardSub:    { margin:'6px 0 0', fontSize:12, color:'#94a3b8' },
//     pulseDot:   { width:8, height:8, borderRadius:'50%', background:'#10b981', animation:'pulse 1.5s infinite', flexShrink:0 },

//     // Charts
//     chartGrid:  { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 },
//     chartWrap:  { background:'#fff', borderRadius:14, padding:'20px 20px 14px', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' },
//     chartLabel: { margin:'0 0 16px', fontWeight:700, fontSize:14, color:'#0f172a' },
//     bars:       { display:'flex', alignItems:'flex-end', gap:6, height:140 },
//     barCol:     { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, height:'100%', justifyContent:'flex-end' },
//     bar:        { width:'100%', borderRadius:'4px 4px 0 0', minHeight:3, position:'relative', transition:'height .4s ease', display:'flex', justifyContent:'center' },
//     barVal:     { position:'absolute', top:-18, fontSize:10, fontWeight:700, color:'#475569' },
//     barDate:    { fontSize:9, color:'#94a3b8', textAlign:'center', whiteSpace:'nowrap' },

//     // Breakdown
//     breakdownCard:  { background:'#fff', borderRadius:14, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.06)', marginBottom:28 },
//     sectionTitle:   { margin:'0 0 20px', fontSize:16, fontWeight:700, color:'#0f172a' },
//     breakdownRow:   { display:'flex', flexDirection:'column', gap:16 },
//     breakdownItem:  { display:'grid', gridTemplateColumns:'12px 140px 40px 1fr', alignItems:'center', gap:12 },
//     breakdownDot:   { width:10, height:10, borderRadius:'50%' },
//     breakdownLabel: { fontSize:14, color:'#374151', fontWeight:500 },
//     breakdownCount: { fontSize:14, fontWeight:700, color:'#0f172a', textAlign:'right' },
//     breakdownBarWrap:{ background:'#f1f5f9', borderRadius:4, height:8, overflow:'hidden' },
//     breakdownBar:   { height:'100%', borderRadius:4, transition:'width .6s ease' },

//     // Table
//     tableWrap:  { background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.06)', marginBottom:20 },
//     table:      { width:'100%', borderCollapse:'collapse' },
//     thead:      { background:'#f8fafc' },
//     th:         { padding:'12px 16px', textAlign:'left', fontSize:12, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:.5, borderBottom:'1px solid #e2e8f0' },
//     tr:         { borderBottom:'1px solid #f1f5f9', transition:'background .15s' },
//     td:         { padding:'14px 16px', fontSize:14, verticalAlign:'middle' },
//     userCell:   { display:'flex', alignItems:'center', gap:10 },
//     tableAvatar:{ width:34, height:34, borderRadius:'50%', background:'#e0e7ff', color:'#0066ff', display:'flex', justifyContent:'center', alignItems:'center', fontWeight:700, fontSize:14, flexShrink:0 },
//     badge:      { padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600 },

//     // Pagination
//     pagination: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 4px' },
//     pageBtn:    { padding:'7px 18px', background:'#fff', border:'1px solid #e2e8f0', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'#374151' },

//     // Search
//     searchBox:  { padding:'9px 16px', borderRadius:10, border:'1.5px solid #e2e8f0', fontSize:14, outline:'none', minWidth:280, background:'#fff' },

//     // Loader
//     loader:     { display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', height:'100vh', background:'#f8fafc' },
//     spinner:    { width:40, height:40, border:'3px solid #e2e8f0', borderTop:'3px solid #0066ff', borderRadius:'50%', animation:'spin 0.7s linear infinite' },
// };

// // Inject keyframes
// const styleTag = document.createElement('style');
// styleTag.textContent = `
//   @keyframes spin  { to { transform: rotate(360deg); } }
//   @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:.5; transform:scale(1.3); } }
//   tr:hover { background: #f8fafc !important; }
// `;
// document.head.appendChild(styleTag);