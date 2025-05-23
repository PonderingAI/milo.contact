import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import JSZip from 'jszip';
import { PostgrestError } from '@supabase/supabase-js';

const expectedIconFilenames = [
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'favicon-96x96.png',
  'apple-touch-icon.png',
  'apple-icon-57x57.png',
  'apple-icon-60x60.png',
  'apple-icon-72x72.png',
  'apple-icon-76x76.png',
  'apple-icon-114x114.png',
  'apple-icon-120x120.png',
  'apple-icon-144x144.png',
  'apple-icon-152x152.png',
  'apple-icon-180x180.png',
  'android-icon-36x36.png',
  'android-icon-48x48.png',
  'android-icon-72x72.png',
  'android-icon-96x96.png',
  'android-icon-144x144.png',
  'android-icon-192x192.png',
  'ms-icon-70x70.png',
  'ms-icon-144x144.png',
  'ms-icon-150x150.png',
  'ms-icon-310x310.png',
];

export async function POST(req: NextRequest) {
  const supabase = createAdminClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Add admin role check if necessary. For now, proceeding if a user is authenticated.
  // This might involve checking a custom claim or a separate table for user roles.
  // Example:
  // const { data: userProfile, error: profileError } = await supabase
  //   .from('user_profiles') // assuming a table 'user_profiles' with a 'role' column
  //   .select('role')
  //   .eq('user_id', user.id)
  //   .single();
  // if (profileError || !userProfile || userProfile.role !== 'admin') {
  //   return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
  // }


  const formData = await req.formData();
  const zipFile = formData.get('zipFile') as File;

  if (!zipFile) {
    return NextResponse.json({ error: 'ZIP file is required' }, { status: 400 });
  }

  if (zipFile.type !== 'application/zip' && zipFile.type !== 'application/x-zip-compressed') {
    return NextResponse.json({ error: 'Invalid file type. Please upload a ZIP file.' }, { status: 400 });
  }
  
  try {
    const zip = new JSZip();
    const zipData = await zipFile.arrayBuffer();
    const loadedZip = await zip.loadAsync(zipData);

    const uploadedIcons: { key: string; value: string }[] = [];
    const errors: string[] = [];
    const missingFiles: string[] = [];

    for (const filename of expectedIconFilenames) {
      const file = loadedZip.file(filename);
      if (file) {
        try {
          const fileData = await file.async('nodebuffer'); 
          const filePath = `icons/${filename}`; // Store in 'icons' folder within the 'public' bucket

          const { error: uploadError } = await supabase.storage
            .from('public') 
            .upload(filePath, fileData, {
              contentType: file.unsafeOriginalName.endsWith('.png') ? 'image/png' : 'image/x-icon',
              upsert: true,
            });

          if (uploadError) {
            errors.push(`Failed to upload ${filename}: ${uploadError.message}`);
            continue;
          }

          const { data: publicUrlData } = supabase.storage
            .from('public')
            .getPublicUrl(filePath);

          if (!publicUrlData || !publicUrlData.publicUrl) {
            errors.push(`Failed to get public URL for ${filename}`);
            continue;
          }
          
          const settingKey = `icon_${filename.replace(/\./g, '_').replace(/-/g, '_')}`;
          uploadedIcons.push({ key: settingKey, value: publicUrlData.publicUrl });

        } catch (e: any) {
          errors.push(`Error processing ${filename}: ${e.message}`);
        }
      } else {
        missingFiles.push(filename);
      }
    }
    
    let message = 'Icons processed.';
    if (missingFiles.length > 0) {
        message += ` Missing files from ZIP: ${missingFiles.join(', ')}.`;
    }


    if (uploadedIcons.length > 0) {
      const { error: dbError } = await supabase
        .from('site_settings') // Ensure this table exists and has 'key' as primary or unique constraint
        .upsert(uploadedIcons.map(icon => ({ key: icon.key, value: icon.value })), {
            onConflict: 'key' 
        });


      if (dbError) {
        errors.push(`Failed to update site_settings: ${dbError.message}`);
      }
    } else if (errors.length === 0 && missingFiles.length === expectedIconFilenames.length) {
      // No files were uploaded because none of the expected files were in the zip.
      return NextResponse.json({ error: 'No expected icon files found in the ZIP.', missingFiles }, { status: 400 });
    }


    if (errors.length > 0) {
      return NextResponse.json({ message, error: errors.join('; '), uploadedIcons, missingFiles }, { status: 500 });
    }

    return NextResponse.json({ message: message + ' All found icons uploaded and settings updated successfully.', uploadedIcons, missingFiles }, { status: 200 });

  } catch (error: any) {
    console.error('Error processing ZIP file:', error);
    return NextResponse.json({ error: `Error processing ZIP file: ${error.message}` }, { status: 500 });
  }
}
