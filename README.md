# Emxtruder

A tool for converting SVG emoji files to 3D GLB models.

## Repository Structure

- `svg/`: Original SVG files from [Noto Emoji font](https://github.com/googlefonts/noto-emoji/)
- `svg_flat/`: SVG files processed with SVGO to flatten groups and gradients
- `glb_flat/`: Output directory for the converted 3D GLB models
- `blender/`: Blender project files used in the conversion process
  - `converter.blend`: Main Blender file for conversion
  - `ball.blend`: Helper Blender file
  - `floating.blend`: Helper Blender file

## Tools and Scripts

### SVGO Configuration

The repository uses SVGO to preprocess SVG files, particularly to flatten SVGs by groups and gradients:

- `svgo.config.mjs`: Configuration for SVGO tool
- `svgo-gradient-plugin.js`: Custom plugin for gradient handling

### Conversion Process

- `converter.py`: Python script used within Blender to convert SVG files into GLB 3D models
  - Imports SVG files into Blender
  - Converts curves to meshes
  - Applies extrusion with incremental values for layering
  - Joins meshes and exports as GLB files

### Data Files

- `svg_files.csv` & `svg_files.json`: Lists of SVG files in the repository
- `glb_files.csv`: List of generated GLB files
- `svgs.json`: Additional SVG metadata

## Usage

1. Place SVG files in the `svg/` directory
2. Run SVGO to flatten SVGs and store them in `svg_flat/`:
   ```
   svgo -f svg/ -o svg_flat/ --config svgo.config.mjs
   ```
3. Open Blender and run the `converter.py` script to generate GLB files in `glb_flat/` directory

## Preview

The HTML file `glber.html` can be used to preview the generated GLB models.

## Credits

- SVG source files from [Google's Noto Emoji](https://github.com/googlefonts/noto-emoji/) project