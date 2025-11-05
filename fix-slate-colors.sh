#!/bin/bash

# BookMate Brand Color Replacements
# Replace all slate colors with proper brand kit colors

files=$(find components app -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" \) 2>/dev/null)

for file in $files; do
  # Background gradients - Replace slate gradients with brand colors
  sed -i '' 's/from-slate-800\/50 to-slate-900\/50/from-bg-card to-black/g' "$file"
  sed -i '' 's/bg-slate-900\/80/bg-black/g' "$file"
  sed -i '' 's/bg-slate-900\/50/bg-black/g' "$file"
  sed -i '' 's/bg-slate-900\/20/bg-black\/20/g' "$file"
  sed -i '' 's/bg-slate-800\/50/bg-bg-card/g' "$file"
  sed -i '' 's/bg-slate-800\/40/bg-bg-card/g' "$file"
  sed -i '' 's/bg-slate-800\/30/bg-bg-card\/30/g' "$file"
  sed -i '' 's/bg-slate-800/bg-bg-card/g' "$file"
  sed -i '' 's/bg-slate-700\/50/bg-border-card/g' "$file"
  sed -i '' 's/bg-slate-700\/40/bg-border-card/g' "$file"
  sed -i '' 's/bg-slate-700\/20/bg-border-card\/20/g' "$file"
  sed -i '' 's/bg-slate-700/bg-border-card/g' "$file"
  
  # Border colors
  sed -i '' 's/border-slate-700\/50/border-border-card/g' "$file"
  sed -i '' 's/border-slate-700\/40/border-border-card/g' "$file"
  sed -i '' 's/border-slate-700\/30/border-border-card/g' "$file"
  sed -i '' 's/border-slate-700\/20/border-border-card\/20/g' "$file"
  sed -i '' 's/border-slate-700/border-border-card/g' "$file"
  sed -i '' 's/border-slate-600\/50/border-yellow\/20/g' "$file"
  sed -i '' 's/border-slate-600/border-yellow\/20/g' "$file"
  
  # Text colors
  sed -i '' 's/text-slate-200/text-text-primary/g' "$file"
  sed -i '' 's/text-slate-300/text-text-primary/g' "$file"
  sed -i '' 's/text-slate-400/text-text-secondary/g' "$file"
  sed -i '' 's/text-slate-500/text-muted/g' "$file"
  sed -i '' 's/text-slate-600/text-muted/g' "$file"
  
  # Placeholder colors
  sed -i '' 's/placeholder-slate-500/placeholder-muted/g' "$file"
  sed -i '' 's/placeholder-slate-400/placeholder-text-secondary/g' "$file"
  
  # Hover states - Replace slate with yellow accents
  sed -i '' 's/hover:border-slate-600\/50/hover:border-yellow\/30/g' "$file"
  sed -i '' 's/hover:bg-slate-700\/20/hover:bg-yellow\/5/g' "$file"
done

echo "✅ Replaced all slate colors with BookMate brand colors"
echo "�� Files updated: $(echo "$files" | wc -l | tr -d ' ')"
