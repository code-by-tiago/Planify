Planify hero video

Arquivos usados na landing:

- public/videos/planify-hero.mp4 — trecho 0:56–1:41 do gravado original (página Planejamentos, BNCC, geração com IA), recortado para ocultar a sidebar esquerda
- public/videos/planify-hero-poster.jpg — frame em ~5s (área principal, sem sidebar)

Se os arquivos não existirem, a landing usa o dashboard animado (LandingHeroLiveDashboard) como fallback.

Para re-gerar a partir do vídeo fonte (trecho + escala):

ffmpeg -ss 56 -i "Gravando....mp4" -t 45 -c:v libx264 -crf 21 -movflags +faststart -vf "scale=1280:-2" -an public/videos/planify-hero-raw.mp4

Para recortar a sidebar esquerda (~320px em 1280px) e manter só a área principal:

ffmpeg -i public/videos/planify-hero-raw.mp4 -vf "crop=960:604:320:0,scale=1280:-2" -c:v libx264 -crf 21 -movflags +faststart -an public/videos/planify-hero.mp4

Para regenerar o poster (~5s):

ffmpeg -ss 5 -i public/videos/planify-hero.mp4 -frames:v 1 -update 1 public/videos/planify-hero-poster.jpg
