#!/bin/bash

# Function to reverse videos
reverse_video() {
    input_file="$1"
    if [[ $input_file == *"_av1"* ]]; then
        output_name="${input_file%.mp4}_reversed.mp4"
        codec="libaom-av1"
    else
        output_name="${input_file%.mp4}_reversed.mp4"
        codec="libx264"
    fi
    
    # Check if output file already exists
    if [ -f "$output_name" ]; then
        echo "Skipping: $output_name already exists"
        return
    fi
    
    echo "Processing: $input_file -> $output_name"
    ffmpeg -i "$input_file" \
        -vf reverse \
        -c:v $codec \
        -pix_fmt yuv420p \
        -strict -2 \
        "$output_name"
}

# Process all MP4 files
for video in ./mo*.mp4; do
    if [[ $video != *"reversed"* ]]; then
        reverse_video "$video"
    fi
done

echo "All videos have been reversed!"