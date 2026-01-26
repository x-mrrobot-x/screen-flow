#!/system/bin/sh

json_response() {
  success="$1"
  data="$2"
  error="$3"
  printf '{"success": %s, "data": %s, "error": %s}\n' "$success" "$data" "$error"
}

list_files() {
  file_type="$1"
  source_folder="$2"

  if [ ! -d "$source_folder" ]; then
    json_response "false" "[]" "\"Source folder does not exist: $source_folder\""
    return 1
  fi

  file_list=$(find "$source_folder" -maxdepth 1 -type f -name "*_*.$file_type" ! -name ".trashed*" 2>/dev/null | grep -vE "_[0-9]+\\.${file_type}\$")

  if [ -z "$file_list" ]; then
    json_response "true" "[]" "null"
    return 0
  fi
  
  # Converte para JSON usando sed
  json_array=$(echo "$file_list" | sed 's/\\/\\\\/g; s/"/\\"/g; s/^/"/; s/$/"/; H; $!d; x; s/\n/,/g; s/^,//')
  
  json_response "true" "[$json_array]" "null"
}

create_app_folders() {
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

move_files() {
    file_list_json="$1"
    dest_folder="$2"
    moved_count=0
    
    file_list=$(echo "$file_list_json" | tr -d '[]"' | tr ',' '\n')

    while IFS= read -r file_path; do
        file_path=$(echo "$file_path" | xargs)
        if [ -n "$file_path" ] && [ -f "$file_path" ]; then
            filename=$(basename "$file_path")
            app_name=$(echo "$filename" | sed -n 's/.*_\([^.]*\)\..*/\1/p')

            if [ -n "$app_name" ]; then
                app_folder="$dest_folder/$app_name"
                if [ -d "$app_folder" ]; then
                    cp "$file_path" "$app_folder/"
                    if [ $? -eq 0 ]; then
                        moved_count=$((moved_count + 1))
                    fi
                fi
            fi
        fi
    done << EOF
$file_list
EOF

    json_response "true" "{\"moved\": $moved_count}" "null"
}

list_expired_in_folder() {
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

remove_files() {
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
    list_files)
      list_files "$1" "$2"
      ;; 
    create_app_folders)
      create_app_folders "$1" "$2"
      ;; 
    move_files)
      move_files "$1" "$2"
      ;; 
    list_expired_in_folder)
      list_expired_in_folder "$1" "$2" "$3"
      ;; 
    remove_files)
      remove_files "$1"
      ;; 
    *)
      json_response "false" "{}" "\"Unknown command: $command\""
      exit 1
      ;; 
  esac
}

main "$@"