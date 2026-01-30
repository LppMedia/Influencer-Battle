import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Trophy, Users, TrendingUp, Music, ArrowRight, Star, Crown } from 'lucide-react';
import { Card, Button, Badge } from '../components/ui/core';
import { formatNumber } from '../lib/utils';

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
    <div className="space-y-12 pb-12">
      
      {/* --- HERO SECTION --- */}
      <div className="relative rounded-3xl overflow-hidden bg-surfaceHighlight border border-white/5">
         {/* Animated Background */}
         <div className="absolute inset-0 bg-gradient-brand opacity-10 animate-pulse"></div>
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
         
         <div className="relative z-10 px-8 py-16 md:py-24 md:px-16 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
                <Badge variant="active" className="px-3 py-1 text-sm">Temporada 4 en Vivo</Badge>
                <h1 className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tight">
                    Crea. <span className="text-transparent bg-clip-text bg-gradient-brand">Compite.</span> <br/>
                    Conquista.
                </h1>
                <p className="text-xl text-zinc-400 max-w-lg">
                    Entra a la arena definitiva de influencers. Crea contenido para marcas globales, escala en la tabla de clasificación y gana premios masivos en efectivo.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                    <Button 
                        size="lg" 
                        className="bg-white text-black hover:bg-zinc-200 text-lg px-8 shadow-glow"
                        onClick={() => navigate('/contests')}
                    >
                        Unirse a la Batalla
                    </Button>
                    <Button 
                        size="lg" 
                        variant="secondary"
                        className="text-lg px-8"
                        onClick={() => navigate('/influencers')}
                    >
                        Ver Rankings
                    </Button>
                </div>
            </div>
            
            {/* 3D-ish Floating Element */}
            <div className="hidden md:block w-80 h-96 relative perspective-1000">
                <div className="absolute inset-0 bg-gradient-brand rounded-2xl rotate-6 opacity-30 blur-sm"></div>
                <div className="absolute inset-0 bg-surface border border-white/10 rounded-2xl -rotate-3 shadow-2xl overflow-hidden flex flex-col">
                     <div className="h-2/3 bg-[url('https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400')] bg-cover bg-center"></div>
                     <div className="flex-1 p-4 bg-glass backdrop-blur-md">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-zinc-400 uppercase">Líder Actual</p>
                                <p className="text-xl font-bold text-white">Alex Rivera</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-yellow-400">1.2M</p>
                                <p className="text-[10px] text-zinc-500">Puntos</p>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
         </div>
      </div>

      {/* --- INFINITE MARQUEE --- */}
      <div className="space-y-4">
         <div className="flex items-center justify-between px-2">
            <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Mejores Creadores en la Arena</p>
            <div className="h-[1px] flex-1 bg-white/10 ml-4"></div>
         </div>
         <div className="relative w-full overflow-hidden mask-fade-sides">
             <div className="flex gap-4 animate-marquee w-max hover:pause">
                 {[...INFLUENCER_IMAGES, ...INFLUENCER_IMAGES].map((src, i) => (
                     <div key={i} className="w-32 h-44 md:w-40 md:h-56 shrink-0 rounded-xl overflow-hidden relative group cursor-pointer border border-white/5 hover:border-purple-500/50 transition-colors">
                        <img src={src} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="Creator" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                            <span className="text-white font-bold text-sm">Ver Perfil</span>
                        </div>
                     </div>
                 ))}
             </div>
         </div>
      </div>

      {/* --- HOW IT WORKS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
             <h2 className="text-3xl font-bold text-white mb-4">Cómo Ganar</h2>
             <p className="text-zinc-400 mb-6">
                 Influencer Battle no se trata solo de seguidores. Se trata de engagement, creatividad e impacto.
             </p>
             <ul className="space-y-4">
                 {[
                     "Rastreo de puntos en tiempo real",
                     "Verificación automatizada",
                     "Rankings globales",
                     "Pagos de premios instantáneos"
                 ].map((item, i) => (
                     <li key={i} className="flex items-center gap-3 text-zinc-300">
                         <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                             <TrendingUp size={14} />
                         </div>
                         {item}
                     </li>
                 ))}
             </ul>
          </div>
          
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1 */}
              <Card className="p-6 bg-surface/50 hover:bg-surface transition-colors border-white/5 hover:border-purple-500/30 group">
                  <div className="w-12 h-12 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Music size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">1. Elige Concurso</h3>
                  <p className="text-sm text-zinc-400">
                      Explora campañas activas. Descarga el audio o recurso oficial y lee el brief creativo.
                  </p>
              </Card>

              {/* Step 2 */}
              <Card className="p-6 bg-surface/50 hover:bg-surface transition-colors border-white/5 hover:border-purple-500/30 group">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Play size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">2. Envía tu Link</h3>
                  <p className="text-sm text-zinc-400">
                      Publica en TikTok/Instagram. Pega el enlace de tu video en el panel para verificar tu entrada.
                  </p>
              </Card>

              {/* Step 3 */}
              <Card className="p-6 bg-surface/50 hover:bg-surface transition-colors border-white/5 hover:border-purple-500/30 group">
                  <div className="w-12 h-12 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Trophy size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">3. Gana Puntos</h3>
                  <p className="text-sm text-zinc-400">
                      1 Vista = 1 Punto. 1 Like = 10 Puntos. Sube en la tabla y reclama el premio en efectivo.
                  </p>
              </Card>
          </div>
      </div>

      {/* --- HALL OF FAME / WINNERS --- */}
      <div className="relative">
         <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent rounded-3xl pointer-events-none"></div>
         <div className="relative z-10 p-8 rounded-3xl border border-yellow-500/10">
             <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                     <Crown className="text-yellow-500 fill-yellow-500/20" size={32} />
                     <h2 className="text-3xl font-bold text-white">Salón de la Fama</h2>
                 </div>
                 <Button variant="ghost" className="text-yellow-500 hover:text-yellow-400">Ver Historial</Button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {RECENT_WINNERS.map((winner, idx) => (
                     <Card key={winner.id} className="bg-[#1C1C20] border-white/5 overflow-hidden group hover:border-yellow-500/30 transition-colors">
                         <div className="p-4 flex items-center gap-4">
                             <div className="relative w-16 h-16 shrink-0">
                                 <img src={winner.image} alt={winner.name} className="w-full h-full rounded-full object-cover ring-2 ring-yellow-500/20" />
                                 <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-xs">
                                     #{idx + 1}
                                 </div>
                             </div>
                             <div>
                                 <h4 className="text-white font-bold">{winner.name}</h4>
                                 <p className="text-xs text-zinc-400">{winner.contest}</p>
                             </div>
                         </div>
                         <div className="px-4 py-3 bg-white/5 flex justify-between items-center border-t border-white/5">
                             <span className="text-sm text-zinc-400">Premio Ganado</span>
                             <span className="font-bold text-yellow-400 text-lg">{winner.prize}</span>
                         </div>
                     </Card>
                 ))}
             </div>
         </div>
      </div>

    </div>
  );
};