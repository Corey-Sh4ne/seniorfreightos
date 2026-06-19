const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const INSTALL_LABELS = {
  assemble_furniture:        'Install — Assembly',
  hang_artwork:              'Install — Art Hang',
  mount_tv_fixture:          'Install — TV / Fixture Mount',
  place_and_position:        'Install — Place & Position',
  debris_removal:            'Install — Debris Removal',
  install_window_treatments: 'Install — Window Treatments',
};

function pct(val) {
  return `${Math.round(val * 100)}%`;
}

function Row({ label, formula, amount, bold, separator }) {
  return (
    <tr className={separator ? 'border-t border-blue-700' : ''}>
      <td className={`py-2 pr-4 text-sm ${bold ? 'font-bold text-white' : 'text-blue-100'}`}>
        {label}
      </td>
      <td className="py-2 pr-8 text-xs text-blue-400 text-right whitespace-nowrap">
        {formula}
      </td>
      <td className={`py-2 text-right text-sm ${bold ? 'font-bold text-white' : 'text-blue-100'}`}>
        {USD.format(amount)}
      </td>
    </tr>
  );
}

export default function PricingQuoteTab({ pricing, project }) {
  if (!pricing) {
    return (
      <div className="bg-[#1f3864] rounded-xl p-6 text-white">
        <p className="text-sm font-semibold mb-2">🔒 Pricing Quote — Visible to Admin Only</p>
        <p className="text-blue-300 text-sm">
          Pricing cannot be calculated — the project rate card is not yet configured.
        </p>
      </div>
    );
  }

  const r = project.rates;
  const wt = pricing.totalWeight.toLocaleString();

  return (
    <div className="bg-[#1f3864] rounded-xl p-6 text-white">
      <p className="text-sm font-semibold mb-5">🔒 Pricing Quote — Visible to Admin Only</p>

      <table className="w-full">
        <tbody>
          <Row label="Receiving" formula={`${wt} lb × $${r.receivingPerLb}`} amount={pricing.receivingCost} />
          <Row
            label="Storage"
            formula={`${wt} lb × $${r.storagePerLbPerDay} × ${project.storageDays} days`}
            amount={pricing.storageCost}
          />
          <Row
            label="Freight"
            formula={`${wt} lb × $${r.freightPerLb} × ${pricing.distanceFactor.toFixed(3)} dist.`}
            amount={pricing.freightCost}
          />
          <Row
            label={`Fuel Surcharge (${pct(r.fuelSurchargePct)})`}
            formula={`${USD.format(pricing.freightCost)} × ${pct(r.fuelSurchargePct)}`}
            amount={pricing.fuelSurcharge}
          />
          {project.rushDelivery && (
            <Row
              label={`Rush Surcharge (${pct(r.rushSurchargePct)})`}
              formula=""
              amount={pricing.rushSurcharge}
            />
          )}

          {pricing.installLineItems.map((item, i) => (
            <Row
              key={i}
              label={INSTALL_LABELS[item.type] ?? item.type}
              formula={`${item.qty} × $${item.rate}`}
              amount={item.amount}
            />
          ))}

          <Row label="Direct Cost Subtotal" formula="" amount={pricing.directCost} bold separator />
          <Row
            label={`Overhead (${pct(r.overheadPct)})`}
            formula={`${USD.format(pricing.directCost)} × ${pct(r.overheadPct)}`}
            amount={pricing.overhead}
          />
          <Row label="Fully Loaded Cost" formula="" amount={pricing.fullyLoadedCost} bold separator />
          <Row
            label={`Margin (${pct(r.marginPct)})`}
            formula={`${USD.format(pricing.fullyLoadedCost)} × ${pct(r.marginPct)}`}
            amount={pricing.margin}
          />
        </tbody>
      </table>

      <div className="mt-4 pt-4 border-t-2 border-white flex items-center justify-between">
        <span className="text-base font-bold">Total Project Bid</span>
        <span className="text-2xl font-extrabold">{USD.format(pricing.totalProjectBid)}</span>
      </div>

      <div className="mt-5">
        <button className="bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
          Send Quote to Client →
        </button>
      </div>
    </div>
  );
}
