import { useI18n } from '@/locales/client';
import { resolveDisplayBranch } from '@/lib/utils';
import { MapPin, Phone, Navigation } from 'lucide-react';

interface ActiveStopProps {
  stop: any;
  onNavigate: () => void;
  onCall: () => void;
}

export function ActiveStopCard({ stop, onNavigate, onCall }: ActiveStopProps) {
  const t = useI18n();
  const delivery = stop.delivery;
  const order = delivery.order;
  const branch = order.orderItems[0]?.branch;
  const address = branch?.deliveryAddress || order.customer.address;
  const phone = branch?.phone || order.customer.phone;

  return (
    <div className="bg-sky-600 text-white rounded-2xl p-5 shadow-xl shadow-sky-200 mb-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <MapPin className="h-32 w-32" />
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="inline-block px-2 py-1 bg-white/20 rounded-md text-xs font-bold backdrop-blur-sm mb-2">
              {t('Driver.dashboard.currentStop')}
            </span>
            <h2 className="text-2xl font-bold leading-tight">{order.customer.name}</h2>
            {branch?.branchName && resolveDisplayBranch(branch.branchName, order.customer.name, order.customer._count?.branches) !== order.customer.name && (
                <p className="text-sky-100 font-medium">{branch.branchName}</p>
            )}
          </div>
          <div className="text-right">
             <span className="text-3xl font-bold">#{stop.stopNumber}</span>
          </div>
        </div>

        <p className="text-sky-100 text-sm mb-6 line-clamp-2 leading-relaxed opacity-90">
          {address || 'No address provided'}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={onNavigate}
            className="bg-white text-sky-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-sky-50 transition-colors shadow-sm"
          >
            <Navigation className="h-5 w-5" />
            {t('Driver.actions.navigate')}
          </button>
          
          {phone ? (
             <a 
               href={`tel:${phone}`}
               className="bg-sky-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-sky-800 transition-colors border border-sky-500"
             >
               <Phone className="h-5 w-5" />
               {t('Driver.actions.call')}
             </a>
          ) : (
             <button disabled className="bg-sky-700/50 text-white/50 font-bold py-3 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
               <Phone className="h-5 w-5" />
               {t('Driver.actions.call')}
             </button>
          )}
        </div>
      </div>
    </div>
  );
}
