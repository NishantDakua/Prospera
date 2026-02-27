/**
 * VIEW: StatCard
 * Reusable KPI / stat tile for the dashboard.
 *
 * @param {string}          label
 * @param {string}          value
 * @param {string}          [sub]       - trend label text
 * @param {string}          [subIcon]   - Material Symbol name
 * @param {string}          [subColor]  - Tailwind text color class
 * @param {string}          [subBg]     - Tailwind bg color class for pill
 * @param {string}          [bgIcon]    - large decorative bg icon
 * @param {React.ReactNode} [children]  - optional slot (e.g. progress bar)
 */
export default function StatCard({ label, value, sub, subIcon, subColor = "text-luxury-gold/60", subBg = "", bgIcon = "payments", children }) {
    return (
        <div className="luxury-glass p-8 flex flex-col gap-4 relative overflow-hidden group rounded-custom">
            <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <span className="material-symbols-outlined text-[120px] text-luxury-gold">{bgIcon}</span>
            </div>

            <p className="text-luxury-gold/60 text-xs font-bold uppercase tracking-widest relative z-10">{label}</p>
            <p className="text-4xl font-extrabold text-luxury-cream relative z-10">{value}</p>

            {sub && (
                <div className={`flex items-center gap-2 ${subColor} text-xs font-bold ${subBg} w-fit px-3 py-1 rounded-full relative z-10`}>
                    <span className="material-symbols-outlined text-sm">{subIcon}</span>
                    <span>{sub}</span>
                </div>
            )}

            {children && <div className="relative z-10">{children}</div>}
        </div>
    );
}
