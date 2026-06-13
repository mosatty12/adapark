import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext.jsx'
import { Pencil, MapPin, TrendingUp, TrendingDown, Plus } from 'lucide-react'
import { formatTLShort } from '../../data/mockData.js'

export default function AdminParkings() {
  const { parkings } = useApp()
  return (
    <div className="page page--wide">
      <div className="row between" style={{ alignItems: 'flex-end', marginBottom: 'var(--space-4)' }}>
        <div>
          <h1>All garages</h1>
          <p className="text-soft">Modify pricing, layouts, amenities and revenue strategy.</p>
        </div>
        <button className="btn btn--primary"><Plus size={14}/> New garage</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Area</th>
                <th className="num nowrap">Spots</th>
                <th className="nowrap">Occupancy</th>
                <th className="nowrap">Rate</th>
                <th>Crowd</th>
                <th className="nowrap">Suggestion</th>
                <th className="num nowrap">Revenue (mo)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {parkings.map((p) => {
                const empty = p.layout.spots.filter((s) => s.status === 'empty').length
                const total = p.layout.spots.length
                const occ = Math.round(((total - empty) / total) * 100)
                return (
                  <tr key={p.id}>
                    <td><b>{p.name}</b></td>
                    <td className="text-soft nowrap"><MapPin size={12} style={{ verticalAlign: 'middle' }} /> {p.area}</td>
                    <td className="num nowrap">{total}</td>
                    <td className="nowrap"><span className="pill pill--ghost">{occ}%</span></td>
                    <td className="mono nowrap">₺{p.hourlyOverride}/hr</td>
                    <td><span className={`pill ${crowdCls(p.crowdLevel)}`}>{p.crowdLevel}</span></td>
                    <td className="nowrap">
                      {p.suggestedFeeChange === 0 ? (
                        <span className="text-soft">—</span>
                      ) : (
                        <span className={`pill ${p.suggestedFeeChange > 0 ? 'pill--warn' : 'pill--ok'}`}>
                          {p.suggestedFeeChange > 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                          {p.suggestedFeeChange > 0 ? '+' : ''}{p.suggestedFeeChange}%
                        </span>
                      )}
                    </td>
                    <td className="mono num nowrap"><b>{formatTLShort(p.revenueMonthTL)}</b></td>
                    <td className="nowrap"><Link to={`/admin/parkings/${p.id}`} className="btn btn--outline"><Pencil size={12}/> Edit</Link></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function crowdCls(c) {
  return c === 'overflow' ? 'pill--bad' : c === 'busy' ? 'pill--warn' : c === 'normal' ? 'pill--info' : 'pill--ok'
}
