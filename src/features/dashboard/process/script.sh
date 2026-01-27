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
    app_name=$(echo "$app_name" | xargs)
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
    local move_output
    local exit_code

    # 1. Contar os arquivos
    count=$(eval "$count_command" 2>/dev/null)
    # trim whitespace
    count=$(echo "$count" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
    count=${count:-0} # Default to 0 if empty

    # Se não houver arquivos, não faz nada
    if [ "$count" -eq 0 ]; then
        json_response "true" "{\"moved\": 0}" "null"
        return 0
    fi
    
    # 2. Mover os arquivos
    move_output=$(eval "$move_command" 2>&1)
    exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        # Retorna a contagem obtida anteriormente
        json_response "true" "{\"moved\": $count}" "null"
    else
        escaped_output=$(printf "%s" "$move_output" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr -d '\n')
        json_response "false" "{}" "{\"message\": \"Erro ao mover arquivos\", \"details\": \"$escaped_output\"}"
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
  removed_count=0

  file_list=$(echo "$file_list_json" | tr -d '[]"' | tr ',' '\n')

  while IFS= read -r file_path; do
    file_path=$(echo "$file_path" | xargs)
    if [ -n "$file_path" ] && [ -f "$file_path" ]; then
      rm "$file_path"
      if [ $? -eq 0 ]; then
        removed_count=$((removed_count + 1))
      fi
    fi
  done << EOF
$file_list
EOF

  json_response "true" "{\"removed\": $removed_count}" "null"
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
    *)
      json_response "false" "{}" "\"Unknown command: $command\""
      exit 1
      ;; 
  esac
}

main "$@"
