$path = 'h:\MyProjects\mango-novoselytsia\index.html'
$content = [System.IO.File]::ReadAllText($path)

$categoryMap = @{
    'bust' = 'Бюстгальтери МАНГО'
    'sets' = 'Комплекти білизни МАНГО'
    'pajamas' = 'Піжами МАНГО'
    'swim' = 'Купальники МАНГО'
    'panties' = 'Трусики МАНГО'
    'homewear' = 'Одяг для дому МАНГО'
    'tops' = 'Топи МАНГО'
    'teen' = 'Підліткова білизна МАНГО'
    'shop' = 'Вітрина та інтер''єр МАНГО'
}

$singleCardPattern = '(?s)<div class="catalog-item"><img src="(?<src>[^"]+\.webp)" loading="lazy"(?: (?<attrs>[^>]*?))?><div class="item-text-overlay"><h4>(?<title>.*?)</h4></div></div>'
$content = [regex]::Replace($content, $singleCardPattern, {
    param($m)
    $src = $m.Groups['src'].Value
    $title = $m.Groups['title'].Value.Trim()
    $folder = ($src -split '/')[0]
    $category = $categoryMap[$folder]
    if (-not $category) { $category = 'Товар МАНГО' }
    $attrs = $m.Groups['attrs'].Value
    if ([string]::IsNullOrWhiteSpace($attrs)) {
        return '<div class="catalog-item"><img src="' + $src + '" loading="lazy" alt="' + $title + ' — ' + $category + '"><div class="item-text-overlay"><h4>' + $title + '</h4></div></div>'
    }
    return '<div class="catalog-item"><img src="' + $src + '" loading="lazy" ' + $attrs + ' alt="' + $title + ' — ' + $category + '"><div class="item-text-overlay"><h4>' + $title + '</h4></div></div>'
})

$specialPattern = '(?s)<div class="catalog-item" style="flex-direction: column; height: auto; padding-bottom: 20px; align-items: stretch; justify-content: flex-start;">\s*<div style="height: 320px; width: 100%; position: relative; overflow: hidden; border-radius: 20px 20px 0 0;">\s*<img src="bust/1\.webp" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;" onerror="this\.parentNode\.parentNode\.style\.display=\'none\'">\s*</div>\s*<div style="padding: 15px; text-align: center;">\s*<h4 style="font-family: \'Comfortaa\', sans-serif; font-size: 15px; font-weight: 700; color: #111; margin-bottom: 8px;">(?<title>.*?)</h4>\s*<p style="font-family: \'Comfortaa\', sans-serif; font-size: 12px; color: #777; margin-bottom: 5px;">Розміри уточнюйте</p>\s*<p style="font-family: \'Comfortaa\', sans-serif; font-size: 14px; font-weight: 700; color: #111; margin-bottom: 15px;">Ціна: в Instagram/Viber</p>\s*</div>\s*</div>'
$content = [regex]::Replace($content, $specialPattern, {
    param($m)
    $title = $m.Groups['title'].Value.Trim()
    return @"
<div class="catalog-item" style="flex-direction: column; height: auto; padding-bottom: 20px; align-items: stretch; justify-content: flex-start;">
    <div style="height: 320px; width: 100%; position: relative; overflow: hidden; border-radius: 20px 20px 0 0;">
        <img src="bust/1.webp" loading="lazy" alt="$title — Бюстгальтери МАНГО" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentNode.parentNode.style.display='none'">
    </div>
    <div style="padding: 15px; text-align: center;">
        <h4 style="font-family: 'Comfortaa', sans-serif; font-size: 15px; font-weight: 700; color: #111; margin-bottom: 8px;">$title</h4>
        <p style="font-family: 'Comfortaa', sans-serif; font-size: 12px; color: #777; margin-bottom: 5px;">Розміри уточнюйте</p>
        <p style="font-family: 'Comfortaa', sans-serif; font-size: 14px; font-weight: 700; color: #111; margin-bottom: 15px;">Ціна: в Instagram/Viber</p>
    </div>
</div>
"@
})

[System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))

$missing = ([regex]::Matches($content, '<div class="catalog-item">\s*<img src="[^"]+\.webp" loading="lazy"(?![^>]*\salt=)', [System.Text.RegularExpressions.RegexOptions]::Singleline)).Count
Write-Output "Remaining catalog images without alt: $missing"
