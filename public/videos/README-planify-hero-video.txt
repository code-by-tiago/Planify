Planify hero video

Arquivos usados na landing:

- public/videos/planify-hero.mp4 — trecho 0:56–1:41 do gravado original (página Planejamentos, BNCC, geração com IA)
- public/videos/planify-hero-poster.jpg — frame em ~1:22 (habilidades sugeridas)

Se os arquivos não existirem, a landing usa o dashboard animado (LandingHeroLiveDashboard) como fallback.

Para re-gerar a partir do vídeo fonte:

ffmpeg -ss 56 -i "Gravando....mp4" -t 45 -c:v libx264 -crf 21 -movflags +faststart -vf "scale=1280:-2" -an public/videos/planify-hero.mp4
