#!/system/bin/sh

# Wrapper for returning JSON
# usage: json_response "true" "{\"key\":\"value\"}" "null"
json_response() {
  success="$1"
  data="$2"
  error="$3"
  printf '{"success": %s, "data": %s, "error": %s}\n' "$success" "$data" "$error"
}

# 1. list_files(file_type, source_folder)
# Returns a JSON array of file paths.
list_files() {
  file_type="$1"
  source_folder="$2"

  if [ ! -d "$source_folder" ]; then
    json_response "false" "[]" "\"Source folder does not exist: $source_folder\""
    return 1
  fi

  file_list=$(find "$source_folder" -type f -name "*.$file_type" 2>/dev/null)

  if [ -z "$file_list" ]; then
    json_response "true" "[]" "null"
    return 0
  fi
  
  json_array="["
  printf "%s" "$file_list" | while IFS= read -r file; do
    escaped_file=$(echo "$file" | sed 's/\\/\\\\/g; s/"/\"/g')
    json_array="$json_array\"$escaped_file\","
  done
  json_array=$(echo "$json_array" | sed 's/,$//')
  json_array="$json_array]"

  json_response "true" "$json_array" "null"
}

# 2. create_app_folders(app_list_json, dest_folder)
# app_list_json is a string like '["app1","app2"]'
create_app_folders() {
  app_list_json="$1"
  dest_folder="$2"
  created_count=0

  if [ ! -d "$dest_folder" ]; then
    mkdir -p "$dest_folder"
  fi

  app_list=$(echo "$app_list_json" | tr -d '[]"' | tr ',' ' ')

  for app_name in $app_list; do
    folder_path="$dest_folder/$app_name"
    if [ ! -d "$folder_path" ]; then
      mkdir -p "$folder_path"
      if [ $? -eq 0 ]; then
        created_count=$((created_count + 1))
      fi
    fi
  done

  json_response "true" "{\"created\": $created_count}" "null"
}

# 3. move_files(file_list_json, dest_folder)
move_files() {
    file_list_json="$1"
    dest_folder="$2"
    moved_count=0
    
    file_list=$(echo "$file_list_json" | tr -d '[]"' | tr ',' ' ')

    for file_path in $file_list; do
        filename=$(basename "$file_path")
        app_name=$(echo "$filename" | sed -n 's/.*_\([^.]*\)\..*/\1/p')

        if [ -n "$app_name" ]; then
            app_folder="$dest_folder/$app_name"
            if [ -d "$app_folder" ]; then
                mv "$file_path" "$app_folder/"
                if [ $? -eq 0 ]; then
                    moved_count=$((moved_count + 1))
                fi
            fi
        fi
    done

    json_response "true" "{\"moved\": $moved_count}" "null"
}

# 4. list_expired_in_folder(folder_path, days, extension)
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
    
    json_array="["
    printf "%s" "$file_list" | while IFS= read -r file; do
        escaped_file=$(echo "$file" | sed 's/\\/\\\\/g; s/"/\"/g')
        json_array="$json_array\"$escaped_file\","
    done
    json_array=$(echo "$json_array" | sed 's/,$//')
    json_array="$json_array]"

    json_response "true" "$json_array" "null"
}

# 5. remove_files(file_list_json)
remove_files() {
  file_list_json="$1"
  removed_count=0

  file_list=$(echo "$file_list_json" | tr -d '[]"' | tr ',' ' ')

  for file_path in $file_list; do
    if [ -f "$file_path" ]; then
      rm "$file_path"
      if [ $? -eq 0 ]; then
        removed_count=$((removed_count + 1))
      fi
    fi
  done

  json_response "true" "{\"removed\": $removed_count}" "null"
}

# Main dispatcher
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
