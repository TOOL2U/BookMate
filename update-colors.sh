#!/bin/bash

# Mobile App Dark Theme Color Migration Script
# Updates all pages to match mobile app design

FILES=(
  "app/settings/page.tsx"
  "app/inbox/page.tsx"
  "app/admin/page.tsx"
  "app/balance/page.tsx"
  "app/dashboard/page.tsx"
  "app/balance-new/page.tsx"
  "components/**/*.tsx"
)

echo "🎨 Updating colors to mobile app dark theme..."

# Function to update colors in a file
update_file() {
  local file=$1
  echo "📄 Processing: $file"
  
  # Text colors
  sed -i '' 's/text-white /text-[#FFFFFF] /g' "$file"
  sed -i '' 's/text-slate-200/text-[#FFFFFF]/g' "$file"
  sed -i '' 's/text-slate-300/text-[#FFFFFF]/g' "$file"
  sed -i '' 's/text-slate-400/text-[#A0A0A0]/g' "$file"
  sed -i '' 's/text-slate-500/text-[#A0A0A0]/g' "$file"
  sed -i '' 's/text-slate-600/text-[#666666]/g' "$file"
  
  # Background colors
  sed -i '' 's/bg-slate-900\/20/bg-[#1A1A1A]/g' "$file"
  sed -i '' 's/bg-slate-900\/30/bg-[#1A1A1A]/g' "$file"
  sed -i '' 's/bg-slate-900\/50/bg-[#1A1A1A]/g' "$file"
  sed -i '' 's/bg-slate-800\/40/bg-[#1A1A1A]/g' "$file"
  sed -i '' 's/bg-slate-800\/50/bg-[#1A1A1A]/g' "$file"
  sed -i '' 's/bg-slate-800\/30/bg-[#1A1A1A]/g' "$file"
  sed -i '' 's/bg-slate-800/bg-[#1A1A1A]/g' "$file"
  sed -i '' 's/bg-slate-700\/50/bg-[#222222]/g' "$file"
  sed -i '' 's/bg-slate-700\/40/bg-[#222222]/g' "$file"
  sed -i '' 's/bg-slate-700/bg-[#222222]/g' "$file"
  
  # Border colors  
  sed -i '' 's/border-slate-700\/50/border-[#2A2A2A]/g' "$file"
  sed -i '' 's/border-slate-700\/40/border-[#2A2A2A]/g' "$file"
  sed -i '' 's/border-slate-700\/30/border-[#2A2A2A]/g' "$file"
  sed -i '' 's/border-slate-700\/20/border-[#2A2A2A]/g' "$file"
  sed -i '' 's/border-slate-700/border-[#2A2A2A]/g' "$file"
  sed -i '' 's/border-slate-600/border-[#2A2A2A]/g' "$file"
  
  # Hover backgrounds
  sed -i '' 's/hover:bg-slate-800/hover:bg-[#222222]/g' "$file"
  sed -i '' 's/hover:bg-slate-700\/50/hover:bg-[#222222]/g' "$file"
  sed -i '' 's/hover:bg-slate-700\/40/hover:bg-[#222222]/g' "$file"
  sed -i '' 's/hover:bg-slate-700/hover:bg-[#222222]/g' "$file"
  
  # Hover text
  sed -i '' 's/hover:text-slate-300/hover:text-[#FFFFFF]/g' "$file"
  sed -i '' 's/hover:text-slate-200/hover:text-[#FFFFFF]/g' "$file"
  
  # Hover borders
  sed -i '' 's/hover:border-slate-600/hover:border-[#00D9FF]/g' "$file"
  sed-i '' 's/hover:border-slate-500/hover:border-[#00D9FF]/g' "$file"
  
  # Blue accent → Cyan
  sed -i '' 's/text-blue-500/text-[#00D9FF]/g' "$file"
  sed -i '' 's/text-blue-400/text-[#00D9FF]/g' "$file"
  sed -i '' 's/bg-blue-600/bg-[#00D9FF]/g' "$file"
  sed -i '' 's/bg-blue-500/bg-[#00D9FF]/g' "$file"
  sed -i '' 's/hover:bg-blue-500/hover:shadow-[0_0_30px_rgba(0,217,255,0.5)]/g' "$file"
  
  # Green → Neon Green
  sed -i '' 's/text-green-500/text-[#00FF88]/g' "$file"
  sed -i '' 's/text-green-600/text-[#00FF88]/g' "$file"
  
  # Red → Neon Pink
  sed -i '' 's/text-red-500/text-[#FF3366]/g' "$file"
  sed -i '' 's/text-red-600/text-[#FF3366]/g' "$file"
  sed -i '' 's/border-red-500/border-[#FF3366]/g' "$file"
  sed -i '' 's/bg-red-900/bg-[#FF3366]/g' "$file"
}

# Process each file
for pattern in "${FILES[@]}"; do
  for file in $pattern; do
    if [ -f "$file" ]; then
      update_file "$file"
    fi
  done
done

echo "✅ Color migration complete!"
