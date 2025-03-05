import bpy
import os

# ---------------------------
# Configuration
# ---------------------------
svg_folder = "C:\github\emxtruder\svg_flat"   # Folder containing SVG files
glb_folder = "C:\github\emxtruder\glb_flat"     # Folder where GLB files will be saved
n_files_to_process = None                   # Set to None to process all files, or an integer for n files only

# Create the target folder if it doesn't exist
if not os.path.exists(glb_folder):
    os.makedirs(glb_folder)

# Get list of SVG files in the svg_folder
svg_files = [f for f in os.listdir(svg_folder) if f.lower().endswith('.svg')]

processed_count = 0

for svg_file in svg_files:
    if n_files_to_process is not None and processed_count >= n_files_to_process:
        break

    # Build the full SVG filepath
    svg_filepath = os.path.join(svg_folder, svg_file)
    print("Processing:", svg_filepath)
    
    # Record objects in the scene before import
    objs_before = set(bpy.data.objects)
    
    # Import the SVG file (creates curve objects)
    bpy.ops.import_curve.svg(filepath=svg_filepath)
    
    # Identify newly created objects
    new_objs = [obj for obj in bpy.data.objects if obj not in objs_before]
    # Store the names of these new objects to avoid later reference errors.
    new_obj_names = [obj.name for obj in new_objs]
    
    # Filter to include only curve objects (the importer should create curves)
    curves = [obj for obj in new_objs if obj.type == 'CURVE']
    if not curves:
        print("No curves imported for", svg_file)
        processed_count += 1
        continue  # Skip to next file if nothing imported
    
    # Sort curves alphabetically by name
    curves.sort(key=lambda obj: obj.name)
    
    # Incrementally assign extrude values and apply scaling in the xy plane
    # The first curve uses a scale factor of 1, the second 1.001, third 1.002, etc.
    for i, curve in enumerate(curves):
        extrude_value = 0.0001 * (i + 1)
        curve.data.extrude = extrude_value
        scale_factor = 1 - i * 0.001
        curve.scale.x *= scale_factor
        curve.scale.y *= scale_factor

    # Convert each curve to a mesh and collect the resulting objects
    meshes = []
    for curve in curves:
        bpy.ops.object.select_all(action='DESELECT')
        curve.select_set(True)
        bpy.context.view_layer.objects.active = curve
        bpy.ops.object.convert(target='MESH')
        meshes.append(bpy.context.active_object)
    
    # Join all mesh objects into a single mesh object
    bpy.ops.object.select_all(action='DESELECT')
    for mesh in meshes:
        mesh.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()
    
    joined_obj = bpy.context.active_object
    # Rename the joined object using the SVG file name (without extension)
    base_name = os.path.splitext(svg_file)[0]
    joined_obj.name = base_name
    
    # Also add the joined object's name to the list (if not already stored)
    if joined_obj.name not in new_obj_names:
        new_obj_names.append(joined_obj.name)
    
    # Set the export filepath for the GLB file
    export_filepath = os.path.join(glb_folder, base_name + ".glb")
    
    # Export only the joined object as a GLB file.
    bpy.ops.object.select_all(action='DESELECT')
    joined_obj.select_set(True)
    bpy.context.view_layer.objects.active = joined_obj
    bpy.ops.export_scene.gltf(filepath=export_filepath, export_format='GLB', use_selection=True)
    print("Exported:", export_filepath)
    
    # ---------------------------
    # Cleanup: Delete objects created in this iteration and remove their parent collections if empty.
    # ---------------------------
    # Record collections associated with imported objects (before deletion)
    imported_collections = set()
    for name in new_obj_names:
        obj = bpy.data.objects.get(name)
        if obj is not None:
            for coll in obj.users_collection:
                imported_collections.add(coll)
    
    # Delete imported objects directly for better performance
    for name in new_obj_names:
        obj = bpy.data.objects.get(name)
        if obj is not None:
            bpy.data.objects.remove(obj, do_unlink=True)
    
    # Purge orphan data blocks to free memory.
    bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True)
    
    # Remove empty parent collections
    for coll in imported_collections:
        if len(coll.objects) == 0:
            bpy.data.collections.remove(coll)
    
    print("Cleaned up objects and collections for", svg_file)
    processed_count += 1

print("Processing complete. Processed", processed_count, "file(s).")
