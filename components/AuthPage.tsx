
import React, { useState } from 'react';
import { User, UserRole, OrganizationData } from '../types';
import { loginUser, registerUser } from '../services/authService';
import { getAddressByCep } from '../services/locationService';
import { 
  validateCPF, validateCNPJ, validateCEP, validatePhone, validateName,
  formatCPF, formatCNPJ, formatCEP, formatPhone 
} from '../services/validationService';
import { ArrowLeft, Mail, Lock, User as UserIcon, Shield, Building2, Loader2, AlertCircle, MapPin, Phone, Search, FileText, Briefcase } from 'lucide-react';

interface AuthPageProps {
  initialMode: 'login' | 'register';
  onSuccess: (user: User) => void;
  onBack: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ initialMode, onSuccess, onBack }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Common Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('resident');
  
  // Resident Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [householdSize, setHouseholdSize] = useState(1);

  // Address Fields (Structured)
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState(''); // This will map to 'region'
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');

  // Organization Fields
  const [orgName, setOrgName] = useState('');
  const [orgCNPJ, setOrgCNPJ] = useState('');
  const [orgSegment, setOrgSegment] = useState('Condomínio');

  const handleCepBlur = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      if (!validateCEP(cep)) {
          setError("CEP inválido.");
          return;
      }

      setCepLoading(true);
      setError(null);
      const data = await getAddressByCep(cleanCep);
      if (data) {
        setStreet(data.street);
        setNeighborhood(data.neighborhood);
        setCity(data.city);
        setUf(data.uf);
      } else {
        setError("CEP não encontrado.");
      }
      setCepLoading(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCep(formatCEP(e.target.value));
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrgCNPJ(formatCNPJ(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleHouseholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow positive integers
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val > 0) {
      setHouseholdSize(val);
    } else if (e.target.value === '') {
      setHouseholdSize(0); // Temporary state while typing
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const response = await loginUser(email, password);
        onSuccess(response.user);
      } else {
        // Validation basic
        if (password !== confirmPassword) throw new Error("Senhas não conferem.");
        if (password.length < 6) throw new Error("Senha deve ter no mínimo 6 caracteres.");

        // Strict Validations
        if (!validateCEP(cep)) throw new Error("CEP inválido.");
        if (!validatePhone(phone)) throw new Error("Telefone inválido (insira DDD + número).");

        if (role === 'resident') {
            if (!validateName(name)) throw new Error("Nome muito curto ou inválido.");
            if (!validateCPF(cpf)) throw new Error("CPF inválido.");
            if (householdSize < 1) throw new Error("Número de moradores deve ser pelo menos 1.");
            if (!street || !number) throw new Error("Preencha o número do endereço.");
        } else {
            if (!validateName(orgName)) throw new Error("Nome da Organização muito curto.");
            if (!validateCNPJ(orgCNPJ)) throw new Error("CNPJ inválido.");
        }

        let orgData: OrganizationData | undefined;
        let finalName = name;
        // Construct full address string for storage compatibility
        const fullAddress = `${street}, ${number}${complement ? ' - ' + complement : ''} - ${city}/${uf}`;

        if (role === 'organization') {
          finalName = orgName;
          orgData = {
             cnpj: orgCNPJ,
             contactName: orgName, // Use Org Name as contact default
             segment: orgSegment
          };
        }

        const response = await registerUser(
           finalName,
           email,
           password,
           role,
           neighborhood, // Region/Bairro
           fullAddress, // Concatenated Address
           phone,
           householdSize || 1,
           cpf,
           orgData
        );
        onSuccess(response.user);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao processar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn my-8">
        
        {/* Header */}
        <div className="bg-green-700 p-6 text-white relative">
          <button 
            onClick={onBack}
            className="absolute left-4 top-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="text-center mt-2">
            <h2 className="text-2xl font-bold">reColeta</h2>
            <p className="text-green-100 text-sm opacity-90">
              {mode === 'login' ? 'Acesse sua conta' : 'Junte-se à sua comunidade'}
            </p>
          </div>
        </div>

        {/* Mode Switch (Tabs for Register) */}
        {mode === 'register' && (
           <div className="flex border-b border-slate-200">
              <button 
                onClick={() => setRole('resident')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${role === 'resident' ? 'text-green-700 border-b-2 border-green-700 bg-green-50' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <UserIcon size={16} /> Morador
              </button>
              <button 
                onClick={() => setRole('organization')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${role === 'organization' ? 'text-green-700 border-b-2 border-green-700 bg-green-50' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Building2 size={16} /> Condomínio/Empresa
              </button>
           </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* REGISTER: FIELDS SPECIFIC TO ROLE */}
          {mode === 'register' && role === 'resident' && (
             <>
               <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                  <input type="text" required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                    value={name} onChange={e => setName(e.target.value)} placeholder="Mínimo 3 letras" minLength={3} />
               </div>

               <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">CPF</label>
                  <div className="relative">
                      <FileText className="absolute left-3 top-3 text-slate-400" size={16} />
                      <input 
                          type="text" required 
                          className="w-full pl-9 p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                          value={cpf} onChange={handleCpfChange} 
                          placeholder="000.000.000-00" 
                          maxLength={14}
                      />
                  </div>
               </div>
               
               <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">CEP (Busca Automática)</label>
                  <div className="relative">
                     <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                     <input 
                       type="text" 
                       required 
                       className="w-full pl-9 p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                       value={cep} 
                       onChange={handleCepChange} 
                       onBlur={handleCepBlur}
                       placeholder="00000-000" 
                       maxLength={9}
                     />
                     {cepLoading && <div className="absolute right-3 top-3"><Loader2 className="animate-spin text-green-600" size={16} /></div>}
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Rua</label>
                      <input 
                        type="text" 
                        required 
                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                        value={street} 
                        onChange={e => setStreet(e.target.value)}
                        placeholder="Rua..." 
                      />
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Número</label>
                      <input type="text" required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                        value={number} onChange={e => setNumber(e.target.value)} placeholder="Nº" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Complemento</label>
                      <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                        value={complement} onChange={e => setComplement(e.target.value)} placeholder="Apto 101" />
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Bairro</label>
                      <input type="text" required readOnly className="w-full p-2.5 border rounded-lg bg-slate-50 text-slate-600 focus:outline-none" 
                        value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Bairro" />
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Cidade</label>
                      <input type="text" required readOnly className="w-full p-2.5 border rounded-lg bg-slate-50 text-slate-600 focus:outline-none" 
                        value={city} placeholder="Cidade" />
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">UF</label>
                      <input type="text" required readOnly className="w-full p-2.5 border rounded-lg bg-slate-50 text-slate-600 focus:outline-none" 
                        value={uf} placeholder="UF" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Celular</label>
                      <input type="tel" required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                        value={phone} onChange={handlePhoneChange} placeholder="(11) 99999-9999" maxLength={15} />
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Moradores</label>
                      <input type="number" min="1" required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                        value={householdSize} onChange={handleHouseholdChange} />
                  </div>
               </div>
             </>
          )}

          {mode === 'register' && role === 'organization' && (
             <>
               <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nome do Condomínio/Empresa</label>
                  <input type="text" required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                    value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="Ex: Condomínio Solar" minLength={3} />
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">CNPJ</label>
                  <input type="text" required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                    value={orgCNPJ} onChange={handleCnpjChange} placeholder="00.000.000/0000-00" maxLength={18} />
               </div>
               
               {/* Simplified Address for Org */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">CEP (Busca Automática)</label>
                  <div className="relative">
                     <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                     <input 
                       type="text" 
                       required 
                       className="w-full pl-9 p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                       value={cep} 
                       onChange={handleCepChange} 
                       onBlur={handleCepBlur}
                       placeholder="00000-000" 
                       maxLength={9}
                     />
                     {cepLoading && <div className="absolute right-3 top-3"><Loader2 className="animate-spin text-green-600" size={16} /></div>}
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Rua</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                    value={street} 
                    onChange={e => setStreet(e.target.value)}
                    placeholder="Rua..." 
                  />
               </div>
               
               <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Bairro</label>
                      <input type="text" required readOnly className="w-full p-2.5 border rounded-lg bg-slate-50 text-slate-600 focus:outline-none" 
                        value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Bairro" />
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Número</label>
                      <input type="text" required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                        value={number} onChange={e => setNumber(e.target.value)} placeholder="Nº" />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Telefone</label>
                    <input type="tel" required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                      value={phone} onChange={handlePhoneChange} placeholder="(11) 99999-9999" maxLength={15} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Segmento</label>
                    <select className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                      value={orgSegment} onChange={e => setOrgSegment(e.target.value)}>
                        <option>Condomínio</option>
                        <option>Empresa</option>
                        <option>Associação</option>
                    </select>
                 </div>
               </div>
             </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
            <div className="relative">
               <Mail className="absolute left-3 top-3 text-slate-400" size={16} />
               <input type="email" required className="w-full pl-9 p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                 value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Senha</label>
            <div className="relative">
               <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
               <input type="password" required className="w-full pl-9 p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                 value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" minLength={6} />
            </div>
          </div>

          {mode === 'register' && (
            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase">Confirmar Senha</label>
               <input type="password" required className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" 
                 value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••" minLength={6} />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-200 transition-all active:scale-95 flex justify-center items-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'login' ? 'Entrar' : 'Cadastrar')}
          </button>

          <div className="text-center pt-4">
             <button
               type="button"
               onClick={() => {
                 setMode(mode === 'login' ? 'register' : 'login');
                 setError(null);
               }}
               className="text-sm font-bold text-green-700 hover:underline"
             >
               {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça Login'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
