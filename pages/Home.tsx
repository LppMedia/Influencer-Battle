import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Trophy, Users, TrendingUp, Music, Crown } from 'lucide-react';
import { Card, Button, Badge } from '../components/ui/core';

// Dummy Data for Winners
const RECENT_WINNERS = [
  {
    id: 1,
    name: "Sarah Jenkins",
    prize: "$5,000",
    contest: "Desafío Midnight Sky",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200",
    score: 98.5
  },
  {
    id: 2,
    name: "Davide Rossi",
    prize: "$2,500",
    contest: "Lanzamiento Neon Lights",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200",
    score: 96.2
  },
  {
    id: 3,
    name: "Elena Fisher",
    prize: "$1,000",
    contest: "Vibras de Verano",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=200",
    score: 94.8
  }
];

// Dummy Data for Marquee
const INFLUENCER_IMAGES = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1463453091185-61582044d556?q=80&w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1513207565459-d7f36bfa1222?q=80&w=300&h=300&fit=crop",
];

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-16 pb-20">
      
      {/* --- HERO SECTION --- */}
      <div className="relative rounded-3xl overflow-hidden bg-surfaceHighlight border border-white/5 min-h-[600px] flex items-center">
         {/* Animated Background */}
         <div className="absolute inset-0 bg-gradient-brand opacity-10 animate-pulse pointer-events-none"></div>
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
         
         <div className="relative z-10 px-6 py-12 md:px-12 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 max-w-2xl">
                <Badge variant="active" className="px-4 py-1.5 text-sm font-semibold tracking-wide">
                    TEMPORADA 4 EN VIVO
                </Badge>
                <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tight">
                    Crea. <span className="text-transparent bg-clip-text bg-gradient-brand">Compite.</span> <br/>
                    Conquista.
                </h1>
                <p className="text-xl text-zinc-400 leading-relaxed">
                    Entra a la arena definitiva de influencers. Crea contenido para marcas globales, escala en la tabla de clasificación y gana premios masivos en efectivo.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <Button 
                        size="lg" 
                        className="bg-white text-black hover:bg-zinc-200 text-base font-bold px-8 shadow-glow h-14"
                        onClick={() => navigate('/contests')}
                    >
                        Unirse a la Batalla
                    </Button>
                    <Button 
                        size="lg" 
                        variant="secondary"
                        className="text-base h-14 px-8 border-white/10 hover:bg-white/5"
                        onClick={() => navigate('/influencers')}
                    >
                        Ver Rankings
                    </Button>
                </div>
            </div>
            
            {/* 3D Floating Element */}
            <div className="hidden lg:flex justify-center perspective-1000">
                <div className="relative w-80 h-[450px] animate-float preserve-3d">
                    {/* Shadow/Glow */}
                    <div className="absolute inset-0 bg-gradient-brand rounded-3xl blur-2xl opacity-40 transform translate-y-10 scale-90"></div>
                    
                    {/* Card Body */}
                    <div className="absolute inset-0 bg-surface border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col transform rotate-y-12 rotate-x-6 transition-transform duration-500 hover:rotate-0">
                         <div className="h-3/4 bg-[url('https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=500')] bg-cover bg-center relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent"></div>
                         </div>
                         <div className="flex-1 p-6 bg-glass backdrop-blur-xl border-t border-white/5 flex flex-col justify-center">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-1">Líder Actual</p>
                                    <p className="text-2xl font-bold text-white">Alex Rivera</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-3xl font-black text-white">1.2M</p>
                                    <p className="text-xs text-zinc-500 font-medium uppercase">Puntos</p>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
         </div>
      </div>

      {/* --- INFINITE MARQUEE --- */}
      <div className="space-y-6">
         <div className="flex items-center justify-between px-4 md:px-0">
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Mejores Creadores</p>
            <div className="h-[1px] flex-1 bg-white/10 ml-6"></div>
         </div>
         <div className="relative w-full overflow-hidden mask-fade-sides py-4">
             <div className="flex gap-6 animate-marquee w-max hover:pause">
                 {[...INFLUENCER_IMAGES, ...INFLUENCER_IMAGES].map((src, i) => (
                     <div key={i} className="w-32 h-44 md:w-48 md:h-64 shrink-0 rounded-2xl overflow-hidden relative group cursor-pointer border border-white/5 hover:border-purple-500/50 transition-all duration-300 transform hover:-translate-y-1">
                        <img src={src} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="Creator" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                            <span className="text-white font-bold text-sm bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">Ver Perfil</span>
                        </div>
                     </div>
                 ))}
             </div>
         </div>
      </div>

      {/* --- HOW IT WORKS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-1 space-y-6">
             <h2 className="text-4xl font-bold text-white">Cómo Ganar</h2>
             <p className="text-zinc-400 text-lg leading-relaxed">
                 Influencer Battle no se trata solo de seguidores. Se trata de engagement, creatividad e impacto real.
             </p>
             <ul className="space-y-4 pt-2">
                 {[
                     "Rastreo de puntos en tiempo real",
                     "Verificación automatizada con IA",
                     "Rankings globales instantáneos",
                     "Pagos de premios garantizados"
                 ].map((item, i) => (
                     <li key={i} className="flex items-center gap-4 text-zinc-300 font-medium">
                         <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shrink-0">
                             <TrendingUp size={16} />
                         </div>
                         {item}
                     </li>
                 ))}
             </ul>
          </div>
          
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                  { icon: Music, title: "1. Elige Concurso", desc: "Explora campañas activas. Descarga el audio o recurso oficial y lee el brief.", color: "pink" },
                  { icon: Play, title: "2. Envía tu Link", desc: "Publica en TikTok/Instagram. Pega el enlace de tu video en el panel.", color: "purple" },
                  { icon: Trophy, title: "3. Gana Puntos", desc: "1 Vista = 1 Punto. 1 Like = 10 Puntos. Sube en la tabla y reclama dinero.", color: "yellow" }
              ].map((step, idx) => (
                <Card key={idx} className="p-8 bg-surface/40 hover:bg-surface transition-all duration-300 border-white/5 hover:border-purple-500/30 group hover:-translate-y-1">
                    <div className={`w-14 h-14 rounded-2xl bg-${step.color}-500/10 text-${step.color}-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ring-1 ring-${step.color}-500/20`}>
                        <step.icon size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                        {step.desc}
                    </p>
                </Card>
              ))}
          </div>
      </div>

      {/* --- HALL OF FAME --- */}
      <div className="relative pt-8">
         <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent rounded-3xl pointer-events-none"></div>
         <div className="relative z-10 p-8 md:p-12 rounded-3xl border border-yellow-500/10 bg-[#0F0F11]">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                 <div className="flex items-center gap-4">
                     <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-yellow-500">
                        <Crown size={32} />
                     </div>
                     <div>
                        <h2 className="text-3xl font-bold text-white">Salón de la Fama</h2>
                        <p className="text-zinc-500 text-sm mt-1">Ganadores de la temporada pasada</p>
                     </div>
                 </div>
                 <Button variant="ghost" className="text-yellow-500 hover:text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/10">Ver Historial Completo</Button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {RECENT_WINNERS.map((winner, idx) => (
                     <Card key={winner.id} className="bg-[#18181B] border-white/5 overflow-hidden group hover:border-yellow-500/30 transition-all hover:transform hover:scale-[1.02]">
                         <div className="p-5 flex items-center gap-5">
                             <div className="relative w-16 h-16 shrink-0">
                                 <img src={winner.image} alt={winner.name} className="w-full h-full rounded-full object-cover ring-2 ring-yellow-500/20 group-hover:ring-yellow-500/50 transition-all" />
                                 <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-xs shadow-lg">
                                     #{idx + 1}
                                 </div>
                             </div>
                             <div>
                                 <h4 className="text-white font-bold text-lg group-hover:text-yellow-400 transition-colors">{winner.name}</h4>
                                 <p className="text-xs text-zinc-500">{winner.contest}</p>
                             </div>
                         </div>
                         <div className="px-5 py-4 bg-white/5 flex justify-between items-center border-t border-white/5 group-hover:bg-yellow-500/5 transition-colors">
                             <span className="text-sm text-zinc-400">Premio Ganado</span>
                             <span className="font-bold text-yellow-400 text-xl tracking-tight">{winner.prize}</span>
                         </div>
                     </Card>
                 ))}
             </div>
         </div>
      </div>

    </div>
  );
};