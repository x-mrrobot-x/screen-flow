#!/system/bin/sh

json_response() {
  success="$1"
  data="$2"
  error="$3"
  printf '{"success": %s, "data": %s, "error": %s}\n' "$success" "$data" "$error"
}

scan_media_app_packages() {
  file_type="$1"
  source_folder="$2"

  if [ ! -d "$source_folder" ]; then
    json_response "false" "[]" "\"Source folder does not exist: $source_folder\""
    return 1
  fi

  package_list=$(find "$source_folder" -maxdepth 1 -type f -name "*_*.$file_type" ! -name ".trashed*" 2>/dev/null \
    | grep -vE "_[0-9]+\.${file_type}" \
    | sed -n "s/.*_\(.*\).${file_type}/\1/p" \
    | sort -u)

  if [ -z "$package_list" ]; then
    json_response "true" "[]" "null"
    return 0
  fi
  
  json_array=$(echo "$package_list" | sed 's/\\/\\\\/g; s/"/\\"/g; s/^/"/; s/$/"/; H; $!d; x; s/\n/,/g; s/^,//')
  
  json_response "true" "[$json_array]" "null"
}

create_app_media_folders() {
  app_list_json="$1"
  dest_folder="$2"
  created_count=0

  if [ ! -d "$dest_folder" ]; then
    mkdir -p "$dest_folder"
  fi

  app_list=$(echo "$app_list_json" | tr -d '[]"' | tr ',' '\n')

  while IFS= read -r app_name; do
    if [ -n "$app_name" ]; then
      folder_path="$dest_folder/$app_name"
      if [ ! -d "$folder_path" ]; then
        mkdir -p "$folder_path"
        if [ $? -eq 0 ]; then
          created_count=$((created_count + 1))
        fi
      fi
    fi
  done << EOF
$app_list
EOF

  json_response "true" "{\"created\": $created_count}" "null"
}

run_batch_command() {
    count_command="$1"
    move_command="$2"
    local count
    local remaining
    local moved_count

    # 1. Contar os arquivos antes de mover
    count=$(eval "$count_command" 2>/dev/null)
    count=$(echo "$count" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
    count=${count:-0}

    # Se não houver arquivos, retorna sucesso
    if [ "$count" -eq 0 ]; then
        json_response "true" "{\"moved\": 0, \"total\": 0}" "null"
        return 0
    fi
    
    # 2. Executar comandos de movimentação (todos serão executados com ;)
    eval "$move_command" 2>/dev/null
    
    # 3. Recontar arquivos restantes para saber quantos foram movidos
    remaining=$(eval "$count_command" 2>/dev/null)
    remaining=$(echo "$remaining" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
    remaining=${remaining:-0}
    
    # 4. Calcular quantos foram movidos com sucesso
    moved_count=$((count - remaining))
    
    # 5. Retornar resultado
    if [ $moved_count -eq $count ]; then
        json_response "true" "{\"moved\": $moved_count, \"total\": $count}" "null"
    else
        failed_count=$((count - moved_count))
        json_response "true" "{\"moved\": $moved_count, \"total\": $count, \"failed\": $failed_count}" "{\"message\": \"$failed_count arquivos não foram movidos\"}"
    fi
}

find_expired_files() {
    folder_path="$1"
    days="$2"
    extension="$3"

    if [ ! -d "$folder_path" ]; then
        json_response "false" "[]" "\"Folder not found: $folder_path\""
        return 1
    fi

    file_list=$(find "$folder_path" -type f -name "*.$extension" -mtime "+$days" 2>/dev/null)

    if [ -z "$file_list" ]; then
        json_response "true" "[]" "null"
        return 0
    fi
    
    json_array=""
    while IFS= read -r file; do
        escaped_file=$(printf "%s" "$file" | sed 's/\\/\\\\/g; s/"/\\"/g')
        if [ -z "$json_array" ]; then
            json_array="\"$escaped_file\""
        else
            json_array="$json_array,\"$escaped_file\""
        fi
    done << EOF
$file_list
EOF

    json_response "true" "[$json_array]" "null"
}

delete_files_batch() {
  file_list_json="$1"
  
  # Remove colchetes, aspas e substitui vírgulas por espaços
  file_list=$(echo "$file_list_json" | tr -d '[]"' | tr ',' ' ')
  
  # Remove os arquivos diretamente (sh expande a lista)
  rm -f $file_list 2>/dev/null
  
  json_response "true" "null" "null"
}

get_folder_stats() {
  base_path="$1"

  if [ ! -d "$base_path" ]; then
    json_response "false" "[]" "\"Base path does not exist: $base_path\""
    return 1
  fi

  json_array=""
  first=true
  
  cd "$base_path"
  for d in */; do
    if [ -d "$d" ]; then
      count=$(ls -1 "$d" | wc -l)
      count=$(echo "$count" | tr -d ' ')
      folder_name="${d%/}"
      escaped=$(printf "%s,%s" "$folder_name" "$count" | sed 's/\\/\\\\/g; s/"/\\"/g')
      
      if [ "$first" = true ]; then
        first=false
      else
        json_array="$json_array,"
      fi
      
      json_array="$json_array\"$escaped\""
    fi
  done
  
  json_response "true" "[$json_array]" "null"
}

main() {
  command="$1"
  shift
  case "$command" in
    scan_media_app_packages)
      scan_media_app_packages "$1" "$2"
      ;; 
    create_app_media_folders)
      create_app_media_folders "$1" "$2"
      ;; 
    run_batch_command)
      run_batch_command "$1" "$2"
      ;; 
    find_expired_files)
      find_expired_files "$1" "$2" "$3"
      ;; 
    delete_files_batch)
      delete_files_batch "$1"
      ;;
    get_folder_stats)
      get_folder_stats "$1"
      ;;
    *)
      json_response "false" "{}" "\"Unknown command: $command\""
      exit 1
      ;; 
  esac
}

main "$@"
