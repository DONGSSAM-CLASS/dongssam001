# GPT Image 프롬프트 모음 — SUPERSTAR KART 실사풍 에셋
모든 프롬프트는 `assets/prompts.json`에도 같은 내용으로 들어 있고, `tools/generate-images.mjs`가 그 파일을 읽어 한 번에 생성합니다.
- 총 **93장**. 파일 경로(`file`)는 게임 코드가 찾는 위치입니다.
- 같은 캐릭터는 먼저 `portrait`를 만든 뒤, 마음에 드는 결과를 **참조 이미지로 넣어** `fullbody`·`turnaround`·`driving`을 만들면 얼굴과 의상이 일정하게 유지됩니다 (이미지 편집/참조 입력 기능 사용).
- 카트 이미지는 **회색 도장**으로 만들고 색은 게임 안에서 캐릭터 색으로 입힙니다.
- 텍스처는 **이음새 없이 반복(seamless tileable)** 되어야 합니다. 생성 후 가장자리를 확인하고, 필요하면 오프셋 합성으로 이음새를 지우세요.

## 공통 스타일 블록

모든 캐릭터·카트·아이콘 프롬프트 앞에 들어갑니다.

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks.
```

공통 제외 문구:

```text
Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

## 캐릭터 (10명 × 4장)

### `char_sejong_portrait` — 세종대왕 선택 카드·로딩·결과·순위표 초상화 (현재 makePortraits 대체)
- 저장 경로: `assets/ui/portraits/sejong.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Bust portrait of King Sejong the Great of Joseon Korea (15th century), wearing a crimson gonryongpo royal robe with round gold dragon embroidery on chest and shoulders, a black ikseongwan hat with two small upright wing-shaped flaps at the back, a jade-plaque belt, neat black mustache and short beard, calm wise smile, holding a rolled hangul scroll in one hand. Front three-quarter view facing slightly left, looking at the viewer, centered, head and shoulders filling 80% of the frame, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_sejong_fullbody` — 세종대왕 로딩 화면·결과 시상대 일러스트, 3D 모델링 참고
- 저장 경로: `assets/ref/characters/sejong_fullbody.png` · 크기 `1024x1536` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Full-body character render of King Sejong the Great of Joseon Korea (15th century), wearing a crimson gonryongpo royal robe with round gold dragon embroidery on chest and shoulders, a black ikseongwan hat with two small upright wing-shaped flaps at the back, a jade-plaque belt, neat black mustache and short beard, calm wise smile, holding a rolled hangul scroll in one hand, wearing white racing gloves, standing in a relaxed heroic pose, full figure visible from head to shoes, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_sejong_turnaround` — 세종대왕 이미지→3D 변환(GLB) 입력 및 모델링 기준 시트
- 저장 경로: `assets/ref/characters/sejong_turnaround.png` · 크기 `1536x1024` · 배경 `opaque`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Character turnaround model sheet of King Sejong the Great of Joseon Korea (15th century), wearing a crimson gonryongpo royal robe with round gold dragon embroidery on chest and shoulders, a black ikseongwan hat with two small upright wing-shaped flaps at the back, a jade-plaque belt, neat black mustache and short beard, calm wise smile, holding a rolled hangul scroll in one hand. Three views side by side on a plain light-grey background: front view, left side view, back view, same character, same scale, neutral A-pose, even flat lighting, no shadows, orthographic camera. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_sejong_driving` — 세종대왕 카트 탑승 자세 모델링 참고
- 저장 경로: `assets/ref/characters/sejong_driving.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. King Sejong the Great of Joseon Korea (15th century), wearing a crimson gonryongpo royal robe with round gold dragon embroidery on chest and shoulders, a black ikseongwan hat with two small upright wing-shaped flaps at the back, a jade-plaque belt, neat black mustache and short beard, calm wise smile, holding a rolled hangul scroll in one hand, seated and gripping a small racing steering wheel with both hands, leaning forward with excitement, viewed from front three-quarter, only the character (no vehicle), isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_yisunsin_portrait` — 이순신 선택 카드·로딩·결과·순위표 초상화 (현재 makePortraits 대체)
- 저장 경로: `assets/ui/portraits/yisunsin.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Bust portrait of Admiral Yi Sun-sin of Joseon Korea (16th century), wearing dark navy dujeong-gap studded armor with rows of brass rivets and red trim, a dark iron helmet with a gold band, a tall gold spike and a red horsehair tassel, black mustache and beard, steady determined expression. Front three-quarter view facing slightly left, looking at the viewer, centered, head and shoulders filling 80% of the frame, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_yisunsin_fullbody` — 이순신 로딩 화면·결과 시상대 일러스트, 3D 모델링 참고
- 저장 경로: `assets/ref/characters/yisunsin_fullbody.png` · 크기 `1024x1536` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Full-body character render of Admiral Yi Sun-sin of Joseon Korea (16th century), wearing dark navy dujeong-gap studded armor with rows of brass rivets and red trim, a dark iron helmet with a gold band, a tall gold spike and a red horsehair tassel, black mustache and beard, steady determined expression, wearing white racing gloves, standing in a relaxed heroic pose, full figure visible from head to shoes, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_yisunsin_turnaround` — 이순신 이미지→3D 변환(GLB) 입력 및 모델링 기준 시트
- 저장 경로: `assets/ref/characters/yisunsin_turnaround.png` · 크기 `1536x1024` · 배경 `opaque`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Character turnaround model sheet of Admiral Yi Sun-sin of Joseon Korea (16th century), wearing dark navy dujeong-gap studded armor with rows of brass rivets and red trim, a dark iron helmet with a gold band, a tall gold spike and a red horsehair tassel, black mustache and beard, steady determined expression. Three views side by side on a plain light-grey background: front view, left side view, back view, same character, same scale, neutral A-pose, even flat lighting, no shadows, orthographic camera. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_yisunsin_driving` — 이순신 카트 탑승 자세 모델링 참고
- 저장 경로: `assets/ref/characters/yisunsin_driving.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Admiral Yi Sun-sin of Joseon Korea (16th century), wearing dark navy dujeong-gap studded armor with rows of brass rivets and red trim, a dark iron helmet with a gold band, a tall gold spike and a red horsehair tassel, black mustache and beard, steady determined expression, seated and gripping a small racing steering wheel with both hands, leaning forward with excitement, viewed from front three-quarter, only the character (no vehicle), isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_saimdang_portrait` — 신사임당 선택 카드·로딩·결과·순위표 초상화 (현재 makePortraits 대체)
- 저장 경로: `assets/ui/portraits/saimdang.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Bust portrait of Shin Saimdang, Joseon-era painter and poet (16th century), wearing a pale pink jeogori with a white collar band and a crimson ribbon tie, a deep indigo chima skirt, glossy black hair in a low bun with a gold binyeo hairpin, gentle graceful smile, holding a fine ink brush. Front three-quarter view facing slightly left, looking at the viewer, centered, head and shoulders filling 80% of the frame, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_saimdang_fullbody` — 신사임당 로딩 화면·결과 시상대 일러스트, 3D 모델링 참고
- 저장 경로: `assets/ref/characters/saimdang_fullbody.png` · 크기 `1024x1536` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Full-body character render of Shin Saimdang, Joseon-era painter and poet (16th century), wearing a pale pink jeogori with a white collar band and a crimson ribbon tie, a deep indigo chima skirt, glossy black hair in a low bun with a gold binyeo hairpin, gentle graceful smile, holding a fine ink brush, wearing white racing gloves, standing in a relaxed heroic pose, full figure visible from head to shoes, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_saimdang_turnaround` — 신사임당 이미지→3D 변환(GLB) 입력 및 모델링 기준 시트
- 저장 경로: `assets/ref/characters/saimdang_turnaround.png` · 크기 `1536x1024` · 배경 `opaque`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Character turnaround model sheet of Shin Saimdang, Joseon-era painter and poet (16th century), wearing a pale pink jeogori with a white collar band and a crimson ribbon tie, a deep indigo chima skirt, glossy black hair in a low bun with a gold binyeo hairpin, gentle graceful smile, holding a fine ink brush. Three views side by side on a plain light-grey background: front view, left side view, back view, same character, same scale, neutral A-pose, even flat lighting, no shadows, orthographic camera. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_saimdang_driving` — 신사임당 카트 탑승 자세 모델링 참고
- 저장 경로: `assets/ref/characters/saimdang_driving.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Shin Saimdang, Joseon-era painter and poet (16th century), wearing a pale pink jeogori with a white collar band and a crimson ribbon tie, a deep indigo chima skirt, glossy black hair in a low bun with a gold binyeo hairpin, gentle graceful smile, holding a fine ink brush, seated and gripping a small racing steering wheel with both hands, leaning forward with excitement, viewed from front three-quarter, only the character (no vehicle), isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_yugwansun_portrait` — 유관순 선택 카드·로딩·결과·순위표 초상화 (현재 makePortraits 대체)
- 저장 경로: `assets/ui/portraits/yugwansun.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Bust portrait of Yu Gwan-sun, Korean independence activist of 1919, as a respectful 17-year-old student, wearing a plain white jeogori and a black skirt in 1919 Korean student style, black hair neatly pulled back, brave hopeful expression, holding a small Taegukgi flag. Front three-quarter view facing slightly left, looking at the viewer, centered, head and shoulders filling 80% of the frame, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_yugwansun_fullbody` — 유관순 로딩 화면·결과 시상대 일러스트, 3D 모델링 참고
- 저장 경로: `assets/ref/characters/yugwansun_fullbody.png` · 크기 `1024x1536` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Full-body character render of Yu Gwan-sun, Korean independence activist of 1919, as a respectful 17-year-old student, wearing a plain white jeogori and a black skirt in 1919 Korean student style, black hair neatly pulled back, brave hopeful expression, holding a small Taegukgi flag, wearing white racing gloves, standing in a relaxed heroic pose, full figure visible from head to shoes, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_yugwansun_turnaround` — 유관순 이미지→3D 변환(GLB) 입력 및 모델링 기준 시트
- 저장 경로: `assets/ref/characters/yugwansun_turnaround.png` · 크기 `1536x1024` · 배경 `opaque`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Character turnaround model sheet of Yu Gwan-sun, Korean independence activist of 1919, as a respectful 17-year-old student, wearing a plain white jeogori and a black skirt in 1919 Korean student style, black hair neatly pulled back, brave hopeful expression, holding a small Taegukgi flag. Three views side by side on a plain light-grey background: front view, left side view, back view, same character, same scale, neutral A-pose, even flat lighting, no shadows, orthographic camera. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_yugwansun_driving` — 유관순 카트 탑승 자세 모델링 참고
- 저장 경로: `assets/ref/characters/yugwansun_driving.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Yu Gwan-sun, Korean independence activist of 1919, as a respectful 17-year-old student, wearing a plain white jeogori and a black skirt in 1919 Korean student style, black hair neatly pulled back, brave hopeful expression, holding a small Taegukgi flag, seated and gripping a small racing steering wheel with both hands, leaning forward with excitement, viewed from front three-quarter, only the character (no vehicle), isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_kimyusin_portrait` — 김유신 선택 카드·로딩·결과·순위표 초상화 (현재 makePortraits 대체)
- 저장 경로: `assets/ui/portraits/kimyusin.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Bust portrait of General Kim Yu-sin of Silla (7th century), wearing gilt-bronze lamellar armor, a golden conical helmet with a plume, a royal purple cape, a sheathed sword on the back, black mustache, confident expression. Front three-quarter view facing slightly left, looking at the viewer, centered, head and shoulders filling 80% of the frame, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_kimyusin_fullbody` — 김유신 로딩 화면·결과 시상대 일러스트, 3D 모델링 참고
- 저장 경로: `assets/ref/characters/kimyusin_fullbody.png` · 크기 `1024x1536` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Full-body character render of General Kim Yu-sin of Silla (7th century), wearing gilt-bronze lamellar armor, a golden conical helmet with a plume, a royal purple cape, a sheathed sword on the back, black mustache, confident expression, wearing white racing gloves, standing in a relaxed heroic pose, full figure visible from head to shoes, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_kimyusin_turnaround` — 김유신 이미지→3D 변환(GLB) 입력 및 모델링 기준 시트
- 저장 경로: `assets/ref/characters/kimyusin_turnaround.png` · 크기 `1536x1024` · 배경 `opaque`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Character turnaround model sheet of General Kim Yu-sin of Silla (7th century), wearing gilt-bronze lamellar armor, a golden conical helmet with a plume, a royal purple cape, a sheathed sword on the back, black mustache, confident expression. Three views side by side on a plain light-grey background: front view, left side view, back view, same character, same scale, neutral A-pose, even flat lighting, no shadows, orthographic camera. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_kimyusin_driving` — 김유신 카트 탑승 자세 모델링 참고
- 저장 경로: `assets/ref/characters/kimyusin_driving.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. General Kim Yu-sin of Silla (7th century), wearing gilt-bronze lamellar armor, a golden conical helmet with a plume, a royal purple cape, a sheathed sword on the back, black mustache, confident expression, seated and gripping a small racing steering wheel with both hands, leaning forward with excitement, viewed from front three-quarter, only the character (no vehicle), isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_cleopatra_portrait` — 클레오파트라 선택 카드·로딩·결과·순위표 초상화 (현재 makePortraits 대체)
- 저장 경로: `assets/ui/portraits/cleopatra.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Bust portrait of Cleopatra VII, queen of Ptolemaic Egypt, wearing a white pleated linen gown, a broad gold usekh collar inlaid with lapis lazuli and carnelian, a gold diadem with a uraeus cobra, sleek black hair with straight bangs, elegant confident smile. Front three-quarter view facing slightly left, looking at the viewer, centered, head and shoulders filling 80% of the frame, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_cleopatra_fullbody` — 클레오파트라 로딩 화면·결과 시상대 일러스트, 3D 모델링 참고
- 저장 경로: `assets/ref/characters/cleopatra_fullbody.png` · 크기 `1024x1536` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Full-body character render of Cleopatra VII, queen of Ptolemaic Egypt, wearing a white pleated linen gown, a broad gold usekh collar inlaid with lapis lazuli and carnelian, a gold diadem with a uraeus cobra, sleek black hair with straight bangs, elegant confident smile, wearing white racing gloves, standing in a relaxed heroic pose, full figure visible from head to shoes, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_cleopatra_turnaround` — 클레오파트라 이미지→3D 변환(GLB) 입력 및 모델링 기준 시트
- 저장 경로: `assets/ref/characters/cleopatra_turnaround.png` · 크기 `1536x1024` · 배경 `opaque`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Character turnaround model sheet of Cleopatra VII, queen of Ptolemaic Egypt, wearing a white pleated linen gown, a broad gold usekh collar inlaid with lapis lazuli and carnelian, a gold diadem with a uraeus cobra, sleek black hair with straight bangs, elegant confident smile. Three views side by side on a plain light-grey background: front view, left side view, back view, same character, same scale, neutral A-pose, even flat lighting, no shadows, orthographic camera. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_cleopatra_driving` — 클레오파트라 카트 탑승 자세 모델링 참고
- 저장 경로: `assets/ref/characters/cleopatra_driving.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Cleopatra VII, queen of Ptolemaic Egypt, wearing a white pleated linen gown, a broad gold usekh collar inlaid with lapis lazuli and carnelian, a gold diadem with a uraeus cobra, sleek black hair with straight bangs, elegant confident smile, seated and gripping a small racing steering wheel with both hands, leaning forward with excitement, viewed from front three-quarter, only the character (no vehicle), isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_napoleon_portrait` — 나폴레옹 선택 카드·로딩·결과·순위표 초상화 (현재 makePortraits 대체)
- 저장 경로: `assets/ui/portraits/napoleon.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Bust portrait of Napoleon Bonaparte, Emperor of the French (early 19th century), wearing a navy blue military coat with gold epaulettes and buttons, a white waistcoat, a black bicorne hat worn sideways with a blue-white-red cockade, short brown hair, commanding grin. Front three-quarter view facing slightly left, looking at the viewer, centered, head and shoulders filling 80% of the frame, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_napoleon_fullbody` — 나폴레옹 로딩 화면·결과 시상대 일러스트, 3D 모델링 참고
- 저장 경로: `assets/ref/characters/napoleon_fullbody.png` · 크기 `1024x1536` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Full-body character render of Napoleon Bonaparte, Emperor of the French (early 19th century), wearing a navy blue military coat with gold epaulettes and buttons, a white waistcoat, a black bicorne hat worn sideways with a blue-white-red cockade, short brown hair, commanding grin, wearing white racing gloves, standing in a relaxed heroic pose, full figure visible from head to shoes, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_napoleon_turnaround` — 나폴레옹 이미지→3D 변환(GLB) 입력 및 모델링 기준 시트
- 저장 경로: `assets/ref/characters/napoleon_turnaround.png` · 크기 `1536x1024` · 배경 `opaque`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Character turnaround model sheet of Napoleon Bonaparte, Emperor of the French (early 19th century), wearing a navy blue military coat with gold epaulettes and buttons, a white waistcoat, a black bicorne hat worn sideways with a blue-white-red cockade, short brown hair, commanding grin. Three views side by side on a plain light-grey background: front view, left side view, back view, same character, same scale, neutral A-pose, even flat lighting, no shadows, orthographic camera. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_napoleon_driving` — 나폴레옹 카트 탑승 자세 모델링 참고
- 저장 경로: `assets/ref/characters/napoleon_driving.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Napoleon Bonaparte, Emperor of the French (early 19th century), wearing a navy blue military coat with gold epaulettes and buttons, a white waistcoat, a black bicorne hat worn sideways with a blue-white-red cockade, short brown hair, commanding grin, seated and gripping a small racing steering wheel with both hands, leaning forward with excitement, viewed from front three-quarter, only the character (no vehicle), isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_genghis_portrait` — 징기스칸 선택 카드·로딩·결과·순위표 초상화 (현재 makePortraits 대체)
- 저장 경로: `assets/ui/portraits/genghis.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Bust portrait of Genghis Khan of the Mongol Empire (13th century), wearing a brown silk deel robe with gold trim and a sash, a fur-brimmed hat with a red crown and gold finial, long drooping black mustache and goatee, fearless expression. Front three-quarter view facing slightly left, looking at the viewer, centered, head and shoulders filling 80% of the frame, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_genghis_fullbody` — 징기스칸 로딩 화면·결과 시상대 일러스트, 3D 모델링 참고
- 저장 경로: `assets/ref/characters/genghis_fullbody.png` · 크기 `1024x1536` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Full-body character render of Genghis Khan of the Mongol Empire (13th century), wearing a brown silk deel robe with gold trim and a sash, a fur-brimmed hat with a red crown and gold finial, long drooping black mustache and goatee, fearless expression, wearing white racing gloves, standing in a relaxed heroic pose, full figure visible from head to shoes, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_genghis_turnaround` — 징기스칸 이미지→3D 변환(GLB) 입력 및 모델링 기준 시트
- 저장 경로: `assets/ref/characters/genghis_turnaround.png` · 크기 `1536x1024` · 배경 `opaque`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Character turnaround model sheet of Genghis Khan of the Mongol Empire (13th century), wearing a brown silk deel robe with gold trim and a sash, a fur-brimmed hat with a red crown and gold finial, long drooping black mustache and goatee, fearless expression. Three views side by side on a plain light-grey background: front view, left side view, back view, same character, same scale, neutral A-pose, even flat lighting, no shadows, orthographic camera. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_genghis_driving` — 징기스칸 카트 탑승 자세 모델링 참고
- 저장 경로: `assets/ref/characters/genghis_driving.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Genghis Khan of the Mongol Empire (13th century), wearing a brown silk deel robe with gold trim and a sash, a fur-brimmed hat with a red crown and gold finial, long drooping black mustache and goatee, fearless expression, seated and gripping a small racing steering wheel with both hands, leaning forward with excitement, viewed from front three-quarter, only the character (no vehicle), isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_davinci_portrait` — 다 빈치 선택 카드·로딩·결과·순위표 초상화 (현재 makePortraits 대체)
- 저장 경로: `assets/ui/portraits/davinci.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Bust portrait of Leonardo da Vinci, Renaissance genius (early 16th century), wearing a dark burgundy beret and a brown Renaissance robe, long flowing white hair and a long white beard, curious twinkling eyes, holding a sketchbook with flying-machine drawings. Front three-quarter view facing slightly left, looking at the viewer, centered, head and shoulders filling 80% of the frame, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_davinci_fullbody` — 다 빈치 로딩 화면·결과 시상대 일러스트, 3D 모델링 참고
- 저장 경로: `assets/ref/characters/davinci_fullbody.png` · 크기 `1024x1536` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Full-body character render of Leonardo da Vinci, Renaissance genius (early 16th century), wearing a dark burgundy beret and a brown Renaissance robe, long flowing white hair and a long white beard, curious twinkling eyes, holding a sketchbook with flying-machine drawings, wearing white racing gloves, standing in a relaxed heroic pose, full figure visible from head to shoes, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_davinci_turnaround` — 다 빈치 이미지→3D 변환(GLB) 입력 및 모델링 기준 시트
- 저장 경로: `assets/ref/characters/davinci_turnaround.png` · 크기 `1536x1024` · 배경 `opaque`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Character turnaround model sheet of Leonardo da Vinci, Renaissance genius (early 16th century), wearing a dark burgundy beret and a brown Renaissance robe, long flowing white hair and a long white beard, curious twinkling eyes, holding a sketchbook with flying-machine drawings. Three views side by side on a plain light-grey background: front view, left side view, back view, same character, same scale, neutral A-pose, even flat lighting, no shadows, orthographic camera. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_davinci_driving` — 다 빈치 카트 탑승 자세 모델링 참고
- 저장 경로: `assets/ref/characters/davinci_driving.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Leonardo da Vinci, Renaissance genius (early 16th century), wearing a dark burgundy beret and a brown Renaissance robe, long flowing white hair and a long white beard, curious twinkling eyes, holding a sketchbook with flying-machine drawings, seated and gripping a small racing steering wheel with both hands, leaning forward with excitement, viewed from front three-quarter, only the character (no vehicle), isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_joan_portrait` — 잔 다르크 선택 카드·로딩·결과·순위표 초상화 (현재 makePortraits 대체)
- 저장 경로: `assets/ui/portraits/joan.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Bust portrait of Joan of Arc (15th century France), wearing polished steel plate armor, short brown pageboy haircut, holding a white banner with a gold fleur-de-lis, brave serene expression. Front three-quarter view facing slightly left, looking at the viewer, centered, head and shoulders filling 80% of the frame, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_joan_fullbody` — 잔 다르크 로딩 화면·결과 시상대 일러스트, 3D 모델링 참고
- 저장 경로: `assets/ref/characters/joan_fullbody.png` · 크기 `1024x1536` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Full-body character render of Joan of Arc (15th century France), wearing polished steel plate armor, short brown pageboy haircut, holding a white banner with a gold fleur-de-lis, brave serene expression, wearing white racing gloves, standing in a relaxed heroic pose, full figure visible from head to shoes, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_joan_turnaround` — 잔 다르크 이미지→3D 변환(GLB) 입력 및 모델링 기준 시트
- 저장 경로: `assets/ref/characters/joan_turnaround.png` · 크기 `1536x1024` · 배경 `opaque`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Character turnaround model sheet of Joan of Arc (15th century France), wearing polished steel plate armor, short brown pageboy haircut, holding a white banner with a gold fleur-de-lis, brave serene expression. Three views side by side on a plain light-grey background: front view, left side view, back view, same character, same scale, neutral A-pose, even flat lighting, no shadows, orthographic camera. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `char_joan_driving` — 잔 다르크 카트 탑승 자세 모델링 참고
- 저장 경로: `assets/ref/characters/joan_driving.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Joan of Arc (15th century France), wearing polished steel plate armor, short brown pageboy haircut, holding a white banner with a gold fleur-de-lis, brave serene expression, seated and gripping a small racing steering wheel with both hands, leaning forward with excitement, viewed from front three-quarter, only the character (no vehicle), isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

## 카트 (5종 × 2장) + 캐릭터별 도장 (10장)

### `kart_kart_hero` — 레이싱 카트 차량 선택 카드 이미지, 모델링 참고
- 저장 경로: `assets/ref/karts/kart_hero.png` · 크기 `1536x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Hero product render of a small lightweight open-wheel go-kart: low tubular chassis, rounded front nose fairing with a number plate, side pods, chrome front and rear bumpers, exposed engine with twin chrome exhaust pipes, small rear spoiler, chunky slick tires. Neutral grey-and-white livery with a blank number roundel so it can be recolored in game. Front three-quarter view from slightly above, empty driver seat, whole vehicle in frame, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `kart_kart_ortho` — 레이싱 카트 이미지→3D 변환 입력, 비율 기준 (길이 3~4m)
- 저장 경로: `assets/ref/karts/kart_ortho.png` · 크기 `1536x1024` · 배경 `opaque`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Vehicle blueprint sheet of a small lightweight open-wheel go-kart: low tubular chassis, rounded front nose fairing with a number plate, side pods, chrome front and rear bumpers, exposed engine with twin chrome exhaust pipes, small rear spoiler, chunky slick tires: four orthographic views arranged in a grid on a plain light-grey background — side view, front view, rear view, top view — same scale, flat even lighting, no perspective, no shadows, neutral grey livery, empty seat. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `kart_formula_hero` — 포뮬러 차량 선택 카드 이미지, 모델링 참고
- 저장 경로: `assets/ref/karts/formula_hero.png` · 크기 `1536x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Hero product render of a sleek open-wheel formula racer: long narrow tapered nose, wide multi-element front wing with endplates, sidepods, tall rear wing, driver halo, exposed suspension arms, wide slick tires. Neutral grey-and-white livery with a blank number roundel so it can be recolored in game. Front three-quarter view from slightly above, empty driver seat, whole vehicle in frame, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `kart_formula_ortho` — 포뮬러 이미지→3D 변환 입력, 비율 기준 (길이 3~4m)
- 저장 경로: `assets/ref/karts/formula_ortho.png` · 크기 `1536x1024` · 배경 `opaque`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Vehicle blueprint sheet of a sleek open-wheel formula racer: long narrow tapered nose, wide multi-element front wing with endplates, sidepods, tall rear wing, driver halo, exposed suspension arms, wide slick tires: four orthographic views arranged in a grid on a plain light-grey background — side view, front view, rear view, top view — same scale, flat even lighting, no perspective, no shadows, neutral grey livery, empty seat. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `kart_sports_hero` — 스포츠카 차량 선택 카드 이미지, 모델링 참고
- 저장 경로: `assets/ref/karts/sports_hero.png` · 크기 `1536x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Hero product render of a low sleek two-seat open sports roadster: smooth curved body, wraparound windshield, glowing LED headlights and red taillights, side air intakes, ducktail spoiler, twin chrome exhaust tips, five-spoke alloy wheels. Neutral grey-and-white livery with a blank number roundel so it can be recolored in game. Front three-quarter view from slightly above, empty driver seat, whole vehicle in frame, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `kart_sports_ortho` — 스포츠카 이미지→3D 변환 입력, 비율 기준 (길이 3~4m)
- 저장 경로: `assets/ref/karts/sports_ortho.png` · 크기 `1536x1024` · 배경 `opaque`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Vehicle blueprint sheet of a low sleek two-seat open sports roadster: smooth curved body, wraparound windshield, glowing LED headlights and red taillights, side air intakes, ducktail spoiler, twin chrome exhaust tips, five-spoke alloy wheels: four orthographic views arranged in a grid on a plain light-grey background — side view, front view, rear view, top view — same scale, flat even lighting, no perspective, no shadows, neutral grey livery, empty seat. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `kart_buggy_hero` — 오프로드 버기 차량 선택 카드 이미지, 모델링 참고
- 저장 경로: `assets/ref/karts/buggy_hero.png` · 크기 `1536x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Hero product render of an off-road dune buggy: tubular roll cage, roof light bar, huge knobby tires, visible coil-over suspension springs, skid plate, rear spare tire, exposed engine. Neutral grey-and-white livery with a blank number roundel so it can be recolored in game. Front three-quarter view from slightly above, empty driver seat, whole vehicle in frame, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `kart_buggy_ortho` — 오프로드 버기 이미지→3D 변환 입력, 비율 기준 (길이 3~4m)
- 저장 경로: `assets/ref/karts/buggy_ortho.png` · 크기 `1536x1024` · 배경 `opaque`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Vehicle blueprint sheet of an off-road dune buggy: tubular roll cage, roof light bar, huge knobby tires, visible coil-over suspension springs, skid plate, rear spare tire, exposed engine: four orthographic views arranged in a grid on a plain light-grey background — side view, front view, rear view, top view — same scale, flat even lighting, no perspective, no shadows, neutral grey livery, empty seat. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `kart_classic_hero` — 클래식 레이서 차량 선택 카드 이미지, 모델링 참고
- 저장 경로: `assets/ref/karts/classic_hero.png` · 크기 `1536x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Hero product render of a 1950s classic cigar-shaped grand prix race car: long rounded aluminum body, oval front grille with vertical bars, white racing roundels on the sides, small wraparound windscreen, headrest fairing, side exhaust pipes, wire-spoke wheels. Neutral grey-and-white livery with a blank number roundel so it can be recolored in game. Front three-quarter view from slightly above, empty driver seat, whole vehicle in frame, isolated on a transparent background. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `kart_classic_ortho` — 클래식 레이서 이미지→3D 변환 입력, 비율 기준 (길이 3~4m)
- 저장 경로: `assets/ref/karts/classic_ortho.png` · 크기 `1536x1024` · 배경 `opaque`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Vehicle blueprint sheet of a 1950s classic cigar-shaped grand prix race car: long rounded aluminum body, oval front grille with vertical bars, white racing roundels on the sides, small wraparound windscreen, headrest fairing, side exhaust pipes, wire-spoke wheels: four orthographic views arranged in a grid on a plain light-grey background — side view, front view, rear view, top view — same scale, flat even lighting, no perspective, no shadows, neutral grey livery, empty seat. Avoid: text, watermark, logo, extra limbs, deformed hands, blurry, low resolution, cropped subject, busy background.
```

### `livery_sejong` — 캐릭터별 카트 도장 (MeshPhysicalMaterial.map)
- 저장 경로: `assets/textures/livery/sejong.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless tileable car-paint livery texture, flat top-down, royal blue with gold accents, dynamic racing stripes and subtle motif inspired by the character's era, clean vector-like shapes, no text, no numbers, even lighting, square tile.
```

### `livery_yisunsin` — 캐릭터별 카트 도장 (MeshPhysicalMaterial.map)
- 저장 경로: `assets/textures/livery/yisunsin.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless tileable car-paint livery texture, flat top-down, crimson red with navy accents, dynamic racing stripes and subtle motif inspired by the character's era, clean vector-like shapes, no text, no numbers, even lighting, square tile.
```

### `livery_saimdang` — 캐릭터별 카트 도장 (MeshPhysicalMaterial.map)
- 저장 경로: `assets/textures/livery/saimdang.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless tileable car-paint livery texture, flat top-down, blossom pink with white accents, dynamic racing stripes and subtle motif inspired by the character's era, clean vector-like shapes, no text, no numbers, even lighting, square tile.
```

### `livery_yugwansun` — 캐릭터별 카트 도장 (MeshPhysicalMaterial.map)
- 저장 경로: `assets/textures/livery/yugwansun.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless tileable car-paint livery texture, flat top-down, pearl white with red and blue accents, dynamic racing stripes and subtle motif inspired by the character's era, clean vector-like shapes, no text, no numbers, even lighting, square tile.
```

### `livery_kimyusin` — 캐릭터별 카트 도장 (MeshPhysicalMaterial.map)
- 저장 경로: `assets/textures/livery/kimyusin.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless tileable car-paint livery texture, flat top-down, royal purple with gold accents, dynamic racing stripes and subtle motif inspired by the character's era, clean vector-like shapes, no text, no numbers, even lighting, square tile.
```

### `livery_cleopatra` — 캐릭터별 카트 도장 (MeshPhysicalMaterial.map)
- 저장 경로: `assets/textures/livery/cleopatra.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless tileable car-paint livery texture, flat top-down, gold with lapis blue accents, dynamic racing stripes and subtle motif inspired by the character's era, clean vector-like shapes, no text, no numbers, even lighting, square tile.
```

### `livery_napoleon` — 캐릭터별 카트 도장 (MeshPhysicalMaterial.map)
- 저장 경로: `assets/textures/livery/napoleon.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless tileable car-paint livery texture, flat top-down, imperial navy with red accents, dynamic racing stripes and subtle motif inspired by the character's era, clean vector-like shapes, no text, no numbers, even lighting, square tile.
```

### `livery_genghis` — 캐릭터별 카트 도장 (MeshPhysicalMaterial.map)
- 저장 경로: `assets/textures/livery/genghis.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless tileable car-paint livery texture, flat top-down, saddle brown with gold accents, dynamic racing stripes and subtle motif inspired by the character's era, clean vector-like shapes, no text, no numbers, even lighting, square tile.
```

### `livery_davinci` — 캐릭터별 카트 도장 (MeshPhysicalMaterial.map)
- 저장 경로: `assets/textures/livery/davinci.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless tileable car-paint livery texture, flat top-down, forest green with parchment accents, dynamic racing stripes and subtle motif inspired by the character's era, clean vector-like shapes, no text, no numbers, even lighting, square tile.
```

### `livery_joan` — 캐릭터별 카트 도장 (MeshPhysicalMaterial.map)
- 저장 경로: `assets/textures/livery/joan.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless tileable car-paint livery texture, flat top-down, steel silver with royal blue accents, dynamic racing stripes and subtle motif inspired by the character's era, clean vector-like shapes, no text, no numbers, even lighting, square tile.
```

## 트랙·환경 텍스처

### `tex_asphalt` — 도로 기본 (T_.asphalt 대체, 흰 선·연석은 코드로 덧그림)
- 저장 경로: `assets/textures/asphalt.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless tileable top-down photo texture of fine racetrack asphalt with subtle aggregate, faint rubber tire marks, no lines, even overcast lighting, square tile.
```

### `tex_curb` — 연석
- 저장 경로: `assets/textures/curb.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless tileable top-down texture of a racing curb with alternating red and white painted blocks along the vertical axis, slightly worn paint, square tile.
```

### `tex_sand` — 선셋 비치 모래
- 저장 경로: `assets/textures/sand.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless tileable top-down photo texture of warm golden beach sand with tiny ripples and shells, even sunlight, square tile.
```

### `tex_grass` — 경복궁 바깥 잔디
- 저장 경로: `assets/textures/grass.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless tileable top-down photo texture of short lush green lawn grass, even lighting, square tile.
```

### `tex_pave_bakseok` — 경복궁 박석 마당
- 저장 경로: `assets/textures/pave_bakseok.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless tileable top-down photo texture of Gyeongbokgung palace courtyard 'bakseok' pavement: large irregular rectangular granite slabs with soft rounded edges and narrow earth joints, warm beige-grey stone, even lighting, square tile.
```

### `tex_granite_blocks` — 석축·월대·광화문 석재
- 저장 경로: `assets/textures/granite_blocks.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless tileable front-facing photo texture of a Korean palace granite block wall with staggered rectangular blocks, light grey stone, square tile.
```

### `tex_roof_giwa` — 기와지붕
- 저장 경로: `assets/textures/roof_giwa.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless tileable texture of dark grey Korean giwa clay roof tiles seen from above along the slope, rows of convex and concave tiles, subtle glaze, square tile.
```

### `tex_dancheong_band` — 처마 아래 단청 띠
- 저장 경로: `assets/textures/dancheong_band.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless horizontally tileable decorative band of Korean dancheong painting: malachite green base with red, blue, white and yellow lotus and geometric motifs, flat frontal view, wide strip.
```

### `tex_lattice_window` — 전각 창살
- 저장 경로: `assets/textures/lattice_window.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Front-facing texture of a traditional Korean wooden lattice window (changsal) with hanji paper behind, red-brown wood grid, flat even lighting, square.
```

### `tex_red_pillar_wood` — 붉은 기둥
- 저장 경로: `assets/textures/red_pillar_wood.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless tileable texture of red-lacquered Korean palace wooden pillar with subtle vertical wood grain, square tile.
```

### `tex_palm_bark` — 야자수 줄기
- 저장 경로: `assets/textures/palm_bark.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless vertically tileable texture of palm tree trunk bark with horizontal ring scars, warm brown, square tile.
```

### `tex_palm_frond` — 야자수 잎 (알파 텍스처)
- 저장 경로: `assets/textures/palm_frond.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Single tropical palm frond leaf, top view, bright green, isolated on a transparent background, stem along the horizontal center line from left to right.
```

### `tex_pine_bark` — 소나무 줄기
- 저장 경로: `assets/textures/pine_bark.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless tileable texture of Korean red pine bark with reddish-brown plates, square tile.
```

### `tex_water_sea` — 바다 표면 색 (노멀맵은 코드 유지)
- 저장 경로: `assets/textures/water_sea.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Seamless tileable top-down texture of clear turquoise tropical sea surface with gentle ripples, square tile.
```

### `tex_stand_crowd` — 관중석 관중 판 (현재 인스턴스 캡슐 대체 가능)
- 저장 경로: `assets/textures/stand_crowd.png` · 크기 `1024x1024` · 배경 `opaque`

```text
Wide frontal photo-like illustration of a colorful cheering stadium crowd seated on tiered grandstand seats, many small diverse cartoon-realistic spectators waving flags, no text, even lighting.
```

## UI·아이콘·코스 아트

### `logo` — 타이틀 로고
- 저장 경로: `assets/ui/logo.png` · 크기 `1536x1024` · 배경 `transparent`

```text
Game logo lettering that reads exactly "SUPERSTAR KART" in bold italic chunky letters, glossy gold-to-orange gradient with dark brown outline and 3D bevel, speed streaks, isolated on a transparent background, no other text.
```

### `item_rocket` — 신기전 아이콘
- 저장 경로: `assets/ui/items/rocket.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Game item icon: a Joseon-dynasty singijeon fire-arrow rocket with a red gunpowder tube and white fletching, flying diagonally with a small flame, isolated on a transparent background, icon composition.
```

### `item_turtle` — 거북선 포탄 아이콘
- 저장 경로: `assets/ui/items/turtle.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Game item icon: a black iron cannonball with a tiny gold turtle-ship (geobukseon) dragon head emblem, glowing orange trail, isolated on a transparent background, icon composition.
```

### `item_celadon` — 고려청자 아이콘
- 저장 경로: `assets/ui/items/celadon.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Game item icon: a Goryeo celadon maebyeong vase with inlaid white crane and cloud pattern, jade-green glaze with glossy highlights, isolated on a transparent background, icon composition.
```

### `item_crown` — 왕의 위엄 아이콘
- 저장 경로: `assets/ui/items/crown.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Game item icon: a golden Silla-style royal crown with jade gogok ornaments, radiant sparkle, isolated on a transparent background, icon composition.
```

### `track_beach` — 선셋 비치 코스 카드·로딩 배경
- 저장 경로: `assets/ui/tracks/beach.png` · 크기 `1536x1024` · 배경 `opaque`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Key art of a sunset beach kart racing circuit: winding asphalt track with red-white curbs along golden sand, palm trees, turquoise sea, rocky islands, a red-white lighthouse, grandstands, warm golden-hour sky, aerial three-quarter view, no vehicles, no text.
```

### `track_palace` — 경복궁 코스 카드·로딩 배경
- 저장 경로: `assets/ui/tracks/palace.png` · 크기 `1536x1024` · 배경 `opaque`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Key art of a kart racing circuit inside Gyeongbokgung palace, Seoul: asphalt track passing through the stone arches of Gwanghwamun gate, curved giwa roofs with dancheong, Geunjeongjeon hall, Gyeonghoeru pavilion over a lotus pond, pine trees, Bugaksan mountain, clear blue sky, aerial three-quarter view, no vehicles, no text.
```

### `bg_menu` — 메뉴 배경
- 저장 경로: `assets/ui/bg_menu.png` · 크기 `1536x1024` · 배경 `opaque`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Abstract menu background for a kart racing game: deep indigo-blue gradient with soft light streaks, bokeh, subtle checkered flag pattern fading at the edges, empty center, no text.
```

### `ult_sejong` — 필살기 아이콘 (⚡ 버튼·토스트)
- 저장 경로: `assets/ui/ults/sejong.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Circular special-ability icon showing a glowing hangul scroll with floating consonant letters, purple magical glow, bold readable silhouette, isolated on a transparent background, no text.
```

### `ult_yisunsin` — 필살기 아이콘 (⚡ 버튼·토스트)
- 저장 경로: `assets/ui/ults/yisunsin.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Circular special-ability icon showing a crane-wing battle formation of ships seen from above with a golden shield, purple magical glow, bold readable silhouette, isolated on a transparent background, no text.
```

### `ult_saimdang` — 필살기 아이콘 (⚡ 버튼·토스트)
- 저장 경로: `assets/ui/ults/saimdang.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Circular special-ability icon showing colorful butterflies and insects from a Joseon grass-and-insect painting, purple magical glow, bold readable silhouette, isolated on a transparent background, no text.
```

### `ult_yugwansun` — 필살기 아이콘 (⚡ 버튼·토스트)
- 저장 경로: `assets/ui/ults/yugwansun.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Circular special-ability icon showing a waving Taegukgi flag with rays of light, purple magical glow, bold readable silhouette, isolated on a transparent background, no text.
```

### `ult_kimyusin` — 필살기 아이콘 (⚡ 버튼·토스트)
- 저장 경로: `assets/ui/ults/kimyusin.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Circular special-ability icon showing a charging hwarang warrior silhouette with gold speed lines, purple magical glow, bold readable silhouette, isolated on a transparent background, no text.
```

### `ult_cleopatra` — 필살기 아이콘 (⚡ 버튼·토스트)
- 저장 경로: `assets/ui/ults/cleopatra.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Circular special-ability icon showing a golden cobra and the Nile under starlight, purple magical glow, bold readable silhouette, isolated on a transparent background, no text.
```

### `ult_napoleon` — 필살기 아이콘 (⚡ 버튼·토스트)
- 저장 경로: `assets/ui/ults/napoleon.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Circular special-ability icon showing three cannonballs fired in a fan with smoke, purple magical glow, bold readable silhouette, isolated on a transparent background, no text.
```

### `ult_genghis` — 필살기 아이콘 (⚡ 버튼·토스트)
- 저장 경로: `assets/ui/ults/genghis.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Circular special-ability icon showing a galloping Mongol horse with dust trail, purple magical glow, bold readable silhouette, isolated on a transparent background, no text.
```

### `ult_davinci` — 필살기 아이콘 (⚡ 버튼·토스트)
- 저장 경로: `assets/ui/ults/davinci.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Circular special-ability icon showing Leonardo's ornithopter flying machine, purple magical glow, bold readable silhouette, isolated on a transparent background, no text.
```

### `ult_joan` — 필살기 아이콘 (⚡ 버튼·토스트)
- 저장 경로: `assets/ui/ults/joan.png` · 크기 `1024x1024` · 배경 `transparent`

```text
Art direction: premium stylized-realistic 3D render in the look of a modern Korean mobile kart racing game. Physically based materials (glossy clear-coat car paint, brushed metal, chrome, rubber, fabric, skin with subsurface scattering), cinematic soft studio lighting with a warm key light and cool rim light, crisp details, high dynamic range, 8k texture quality. Characters use heroic chibi proportions (head about 1/3 of body height, large expressive eyes) but with realistic skin, hair strands and fabric weave. Historically grounded costumes. Friendly, school-appropriate, no weapons pointed at the viewer, no gore. Do not copy any existing game's characters, logos or brand marks. Circular special-ability icon showing a white fleur-de-lis banner with a radiant halo, purple magical glow, bold readable silhouette, isolated on a transparent background, no text.
```
