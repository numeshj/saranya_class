import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../components/ToastProvider';

type Subject = { _id:string; name:string; code:string };

const SubjectsPage: React.FC = () => {
  const [items, setItems] = useState<Subject[]>([]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const { push } = useToast();
  async function load(){
    const res = await api.get('/academic/subjects');
    setItems(res.data);
  }
  useEffect(()=>{ load(); },[]);
  async function create(e:React.FormEvent){
    e.preventDefault();
    await api.post('/academic/subjects', { name, code });
    push({ message:'Subject created', type:'success' });
    setName(''); setCode('');
    load();
  }
  return (
    <div className="grid" style={{ maxWidth:600 }}>
      <form onSubmit={create} className="card grid" style={{ gap:12 }}>
        <h3>Create Subject</h3>
        <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} required />
        <input placeholder="Code" value={code} onChange={e=>setCode(e.target.value)} required />
        <button className="button">Add</button>
      </form>
      <div className="card">
        <h3>Subjects</h3>
        <ul style={{ listStyle:'none', padding:0, margin:0, display:'grid', gap:8 }}>
          {items.map(s=> <li key={s._id} style={{ background:'#111827', padding:'0.6rem 0.8rem', borderRadius:8, display:'flex', justifyContent:'space-between' }}><span>{s.name} ({s.code})</span></li>)}
        </ul>
      </div>
    </div>
  );
};
export default SubjectsPage;