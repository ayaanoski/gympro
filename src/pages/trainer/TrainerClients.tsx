import React, { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { User, AltArrowRight, Magnifer } from '@solar-icons/react';
import { useNavigate } from 'react-router-dom';

export const TrainerClients: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = db.collection('members')
      .where('trainer_id', '==', user.uid)
      .onSnapshot((snap) => {
        setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
    return () => unsub();
  }, [user]);

  const filtered = members.filter((m: any) =>
    m.name?.toLowerCase().includes(search.toLowerCase()) || m.phone?.includes(search)
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-10 pb-10">
      <div>
        <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight">My Clients</h1>
        <p className="text-gray-500 mt-2 text-sm md:text-lg font-medium">{members.length} assigned member{members.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="relative group">
        <Magnifer className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-brand-primary" />
        <input type="text" placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] shadow-premium focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-medium text-gray-600" />
      </div>

      <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-premium overflow-hidden">
        {filtered.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {filtered.map((member: any) => (
              <div key={member.id} onClick={() => navigate(`/members/${member.id}`)}
                className="flex items-center justify-between p-4 md:p-6 hover:bg-gray-50/50 transition-colors cursor-pointer group gap-4">
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                  <div className="w-10 md:w-12 h-10 md:h-12 bg-pastel-indigo rounded-2xl flex items-center justify-center font-black text-brand-primary overflow-hidden shrink-0">
                    {member.photo ? <img src={member.photo} alt="" className="w-full h-full object-cover" /> : member.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm md:text-base font-black text-gray-900 truncate">{member.name}</p>
                    <p className="text-xs font-bold text-gray-400 truncate">{member.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-4 shrink-0">
                  <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${member.status === 'active' ? 'bg-pastel-emerald text-red-500 border border-red-100' : 'bg-pastel-pink text-pink-500 border border-pink-100'}`}>
                    {member.status}
                  </span>
                  <AltArrowRight className="w-5 h-5 text-gray-300 group-hover:text-brand-primary transition-all" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 md:py-16">
            <User className="w-10 h-10 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-black text-sm uppercase tracking-widest">{search ? 'No clients match your search' : 'No clients assigned yet'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
