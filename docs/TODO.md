# Portfolio Project TODO List

## Storage Buckets Setup

The following storage buckets need to be created in Supabase:

1. **project-images**: For storing project thumbnails and gallery images
   - Public read access
   - Admin write access

2. **site-assets**: For storing site-wide assets like logos, favicons, etc.
   - Public read access
   - Admin write access

3. **bts-images**: For storing behind-the-scenes project images
   - Public read access
   - Admin write access

4. **media**: For storing general media files
   - Public read access
   - Admin write access

5. **icons**: For storing app icons and favicons
   - Public read access
   - Admin write access

## Future Improvements

- Create a single setup script that creates all required tables AND storage buckets
- Add a setup wizard that guides users through the entire setup process
- Implement automatic bucket creation via the Supabase API
- Add more comprehensive error handling for setup failures
- Create a dashboard that shows setup status for all components
- Add sample data seeding option for quick demos
