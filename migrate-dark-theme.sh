#!/bin/bash

# 🎨 Dark Theme Color Migration Script
# Automatically updates all slate colors to new dark theme colors

echo "🎨 Starting Dark Theme Color Migration..."
echo ""

# Define color mappings
declare -A color_map=(
  # Backgrounds
  ["bg-slate-800/50"]="bg-[#1A1A1A]"
  ["bg-slate-800/30"]="bg-[#1A1A1A]"
  ["bg-slate-800"]="bg-[#1A1A1A]"
  ["bg-slate-900/50"]="bg-[#1A1A1A]"
  ["bg-slate-900"]="bg-[#000000]"
  ["bg-slate-700/50"]="bg-[#2A2A2A]"
  ["bg-slate-700/30"]="bg-[#2A2A2A]"
  ["bg-slate-700"]="bg-[#2A2A2A]"
  
  # Borders
  ["border-slate-800"]="border-[#2A2A2A]"
  ["border-slate-700/50"]="border-[#2A2A2A]"
  ["border-slate-700/30"]="border-[#2A2A2A]"
  ["border-slate-700/20"]="border-[#2A2A2A]"
  ["border-slate-700"]="border-[#2A2A2A]"
  ["border-slate-600"]="border-[#2A2A2A]"
  
  # Text colors
  ["text-slate-200"]="text-[#FFFFFF]"
  ["text-slate-300"]="text-[#FFFFFF]"
  ["text-slate-400"]="text-[#A0A0A0]"
  ["text-slate-500"]="text-[#A0A0A0]"
  ["text-slate-600"]="text-[#666666]"
  
  # Status colors
  ["text-green-500"]="text-[#00FF88]"
  ["text-green-600"]="text-[#00FF88]"
  ["text-red-500"]="text-[#FF3366]"
  ["text-red-600"]="text-[#FF3366]"
  ["text-blue-400"]="text-[#00D9FF]"
  ["text-blue-500"]="text-[#00D9FF]"
  
  # Hover states
  ["hover:bg-slate-800"]="hover:bg-[#222222]"
  ["hover:bg-slate-700/50"]="hover:bg-[#222222]"
  ["hover:bg-slate-700"]="hover:bg-[#222222]"
  ["hover:text-slate-300"]="hover:text-[#FFFFFF]"
  ["hover:text-slate-200"]="hover:text-[#FFFFFF]"
  ["hover:border-slate-600"]="hover:border-[#00D9FF]"
  ["hover:border-slate-500"]="hover:border-[#00D9FF]"
)

# Files to process
files=(
  "app/pnl/page.tsx"
  "app/settings/page.tsx"
  "app/dashboard/page.tsx"
  "app/balance/page.tsx"
  "app/balance-new/page.tsx"
  "app/inbox/page.tsx"
  "app/upload/page.tsx"
  "app/review/[id]/page.tsx"
  "components/**/*.tsx"
)

# Count replacements
total_replacements=0

# Process each file pattern
for pattern in "${files[@]}"; do
  # Find matching files
  for file in $pattern; do
    if [ -f "$file" ]; then
      echo "📄 Processing: $file"
      
      # Make replacements
      for old_color in "${!color_map[@]}"; do
        new_color="${color_map[$old_color]}"
        
        # Count occurrences
        count=$(grep -o "$old_color" "$file" | wc -l | tr -d ' ')
        
        if [ "$count" -gt 0 ]; then
          # Replace in file (macOS compatible)
          sed -i '' "s/$old_color/$new_color/g" "$file"
          echo "  ✅ Replaced '$old_color' → '$new_color' ($count times)"
          total_replacements=$((total_replacements + count))
        fi
      done
    fi
  done
done

echo ""
echo "✨ Migration complete!"
echo "📊 Total replacements: $total_replacements"
echo ""
echo "🔍 Next steps:"
echo "1. Review changes with: git diff"
echo "2. Test the app locally: npm run dev"
echo "3. Check for any styling issues"
echo "4. Commit changes: git commit -am 'style: Migrate to dark theme colors'"
