
import React, { useState } from 'react';
import { User } from '../types';
import { updateUserProfile } from '../services/authService';
import { getAddressByCep } from '../services/locationService';
import { 
  validateCPF, validateCNPJ, validateCEP, validatePhone, validateName,
  formatCPF, formatCNPJ, formatCEP, formatPhone 
} from '../services/validationService';
import { User as UserIcon, Mail, Phone, MapPin, Users as UsersIcon, Save, Loader2, Shield, Camera, Building2, Search, FileText, Briefcase } from 'lucide-react';

interface ProfilePageProps {
  user: User | null;
  onUpdate: (user: User) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Common Fields
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  
  // Resident Fields
  const [householdSize, setHouseholdSize] = useState(user?.householdSize || 1);
  const [cpf, setCpf] = useState(user?.cpf || '');

  // Organization Fields
  const [orgData, setOrgData] = useState({
    cnpj: user?.organizationData?.cnpj || '',
    contactName: user?.organizationData?.contactName || '',
    segment: user?.organizationData?.segment || 'Condomínio'
  });

  // Address Helper
  const [cep, setCep] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [addressNumber, setAddressNumber] = useState('');

  if (!user) return <div>Carregando perfil...</div>;

  const handleCepSearch = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length < 8) return;

    if (!validateCEP(cep)) {
        alert("CEP inválido.");
        return;
    }

    setCepLoading(true);
    const data = await getAddressByCep(cleanCep);
    if (data) {
        // Pre-fill the address field but allow user to complete it
        const baseAddress = `${data.street}, ${addressNumber || 'Nº'} - ${data.neighborhood}, ${data.city}/${data.uf}`;
        setAddress(baseAddress);
    } else {
        alert("CEP não encontrado.");
    }
    setCepLoading(false);
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCep(formatCEP(e.target.value));
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrgData({...orgData, cnpj: formatCNPJ(e.target.value)});
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };
  
  const handleHouseholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
      if (!isNaN(val) && val > 0) {
        setHouseholdSize(val);
      } else if (e.target.value === '') {
        setHouseholdSize(0);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);

    try {
      // Basic validation
      if (!validateName(name)) throw new Error("Nome muito curto ou inválido.");
      if (user.role === 'resident' && address.length < 5) throw new Error("Endereço inválido.");
      if (!validatePhone(phone)) throw new Error("Telefone inválido.");

      // Strict Validation
      if (user.role === 'resident') {
          if (cpf && !validateCPF(cpf)) throw new Error("CPF inválido.");
          if (householdSize < 1) throw new Error("Número de moradores deve ser pelo menos 1.");
      }
      if (user.role === 'organization') {
          if (orgData.cnpj && !validateCNPJ(orgData.cnpj)) throw new Error("CNPJ inválido.");
          if (orgData.contactName && !validateName(orgData.contactName)) throw new Error("Nome do contato inválido.");
      }

      const updatedData: any = {
        id: user.id,
        name,
        phone,
        address,
        region: user.region // Region is generally immutable in profile for simplicity, handled by logic
      };

      if (user.role === 'resident') {
        updatedData.householdSize = householdSize;
        updatedData.cpf = cpf;
      } else {
        updatedData.organizationData = orgData;
      }

      const updatedUser = await updateUserProfile(updatedData);

      onUpdate(updatedUser);
      setSuccess("Perfil atualizado com sucesso!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      alert(error.message || "Erro ao atualizar perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <header>
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          Meu Perfil
        </h2>
        <p className="text-slate-500">Gerencie suas informações de cadastro.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Read-only Info */}
        <div className="md:col-span-1 space-y-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="relative group cursor-pointer mb-4">
                 <img 
                   src={user.avatar} 
                   alt={user.name} 
                   className="w-32 h-32 rounded-full border-4 border-slate-50 shadow-inner object-cover"
                 />
                 <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" />
                 </div>
              </div>
              <h3 className="font-bold text-xl text-slate-800">{user.name}</h3>
              <div className={`mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${user.role === 'organization' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                 {user.role === 'organization' ? <Building2 size={12} /> : <UserIcon size={12} />}
                 {user.role === 'organization' ? 'Organização' : 'Morador'}
              </div>
              <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                 <MapPin size={12} /> {user.region}
              </div>
           </div>

           <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Dados de Acesso</h4>
              
              <div className="space-y-4">
                 <div>
                    <label className="text-xs text-slate-500 font-medium mb-1 block">Email (Login)</label>
                    <div className="flex items-center gap-2 text-slate-700 bg-white p-2 rounded border border-slate-200">
                       <Mail size={16} className="text-slate-400" />
                       <span className="text-sm truncate">{user.email}</span>
                    </div>
                 </div>
                 
                 <div>
                    <label className="text-xs text-slate-500 font-medium mb-1 block">ID do Usuário</label>
                    <div className="text-xs text-slate-400 font-mono bg-white p-2 rounded border border-slate-200 truncate">
                       {user.id}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column: Editable Form */}
        <div className="md:col-span-2">
           <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-100">
              <h3 className="font-bold text-lg text-slate-800 mb-6 pb-2 border-b border-slate-100">
                Informações {user.role === 'organization' ? 'da Entidade' : 'Pessoais'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                 {/* Identity Fields */}
                 <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">{user.role === 'organization' ? 'Nome Fantasia' : 'Nome Completo'}</label>
                    <div className="relative">
                      {user.role === 'organization' ? <Building2 className="absolute left-3 top-3 text-slate-400" size={18} /> : <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />}
                      <input 
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        minLength={3}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                      />
                    </div>
                 </div>

                 {/* Additional Identity Fields (CPF for Resident) */}
                 {user.role === 'resident' && (
                     <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">CPF</label>
                        <div className="relative">
                           <FileText className="absolute left-3 top-3 text-slate-400" size={18} />
                           <input 
                              type="text" 
                              value={cpf}
                              onChange={handleCpfChange}
                              maxLength={14}
                              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                              placeholder="000.000.000-00"
                           />
                        </div>
                     </div>
                 )}

                 {/* Organization Specific Fields */}
                 {user.role === 'organization' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <div className="space-y-1 md:col-span-2">
                           <label className="text-xs font-bold text-purple-800 uppercase">Dados da Organização</label>
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-slate-600">CNPJ</label>
                           <div className="relative">
                              <FileText className="absolute left-3 top-2.5 text-slate-400" size={14} />
                              <input 
                                 type="text" 
                                 value={orgData.cnpj}
                                 onChange={handleCnpjChange}
                                 maxLength={18}
                                 className="w-full pl-8 pr-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                              />
                           </div>
                        </div>
                        <div className="space-y-1">
                           <label className="text-xs font-medium text-slate-600">Segmento</label>
                           <div className="relative">
                              <Briefcase className="absolute left-3 top-2.5 text-slate-400" size={14} />
                              <select 
                                 value={orgData.segment}
                                 onChange={e => setOrgData({...orgData, segment: e.target.value})}
                                 className="w-full pl-8 pr-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:border-purple-400 bg-white"
                              >
                                 <option>Condomínio</option>
                                 <option>Empresa</option>
                                 <option>Associação</option>
                                 <option>Outro</option>
                              </select>
                           </div>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                           <label className="text-xs font-medium text-slate-600">Nome do Responsável</label>
                           <div className="relative">
                              <UserIcon className="absolute left-3 top-2.5 text-slate-400" size={14} />
                              <input 
                                 type="text" 
                                 value={orgData.contactName}
                                 onChange={e => setOrgData({...orgData, contactName: e.target.value})}
                                 className="w-full pl-8 pr-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                              />
                           </div>
                        </div>
                    </div>
                 )}

                 {/* Contact Fields */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                       <label className="text-sm font-medium text-slate-700">Telefone / Contato</label>
                       <div className="relative">
                         <Phone className="absolute left-3 top-3 text-slate-400" size={18} />
                         <input 
                           type="tel" 
                           value={phone}
                           onChange={handlePhoneChange}
                           maxLength={15}
                           className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                         />
                       </div>
                    </div>
                    
                    {user.role === 'resident' && (
                        <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Pessoas na Residência</label>
                        <div className="relative">
                            <UsersIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                            type="number" 
                            min="1" max="20"
                            value={householdSize}
                            onChange={handleHouseholdChange}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                            />
                        </div>
                        </div>
                    )}
                 </div>

                 {/* Address Section */}
                 <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-end">
                       <label className="text-sm font-bold text-slate-700">Endereço Completo</label>
                       
                       {/* CEP Helper */}
                       <div className="flex items-center gap-1">
                          <input 
                            type="text" 
                            placeholder="Buscar CEP..." 
                            className="text-xs p-1.5 border border-slate-300 rounded w-24 focus:outline-none focus:border-green-500"
                            value={cep}
                            onChange={handleCepChange}
                            maxLength={9}
                          />
                          <input 
                            type="text" 
                            placeholder="Nº" 
                            className="text-xs p-1.5 border border-slate-300 rounded w-12 focus:outline-none focus:border-green-500"
                            value={addressNumber}
                            onChange={(e) => setAddressNumber(e.target.value)}
                          />
                          <button 
                            type="button" 
                            onClick={handleCepSearch}
                            disabled={cepLoading}
                            className="bg-slate-100 p-1.5 rounded hover:bg-slate-200 text-slate-600"
                            title="Preencher endereço via CEP"
                          >
                             {cepLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                          </button>
                       </div>
                    </div>

                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                      <textarea 
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all resize-none h-20"
                        placeholder="Rua, Número, Bairro, CEP"
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                        Dica: Use a busca por CEP acima para formatar o endereço corretamente.
                    </p>
                 </div>

                 <div className="pt-4 flex items-center justify-between">
                    {success ? (
                       <span className="text-green-600 font-medium bg-green-50 px-3 py-1 rounded-lg animate-fadeIn flex items-center gap-2">
                         <Save size={16} /> {success}
                       </span>
                    ) : (
                       <span></span> // Spacer
                    )}

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-md shadow-green-200 transition-transform active:scale-95 disabled:opacity-70"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                      Salvar Alterações
                    </button>
                 </div>
              </form>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
