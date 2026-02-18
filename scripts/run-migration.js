// Import the child_process module
const { exec } = require('child_process')

// Function to run the migration command
function runMigration() {
    // Set NODE_ENV properly for Windows + Linux
    const command =
        process.platform === 'win32'
            ? 'set NODE_ENV=migration && npm run migration:run -- -d src/config/data-source.ts'
            : 'NODE_ENV=migration npm run migration:run -- -d src/config/data-source.ts'

    exec(
        'npm run migration:run -- -d src/config/data-source.ts',
        {
            env: { ...process.env, NODE_ENV: 'migration' },
        },
        (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing migration: ${error.message}`)
                return
            }

            if (stderr) {
                console.error(`Error output: ${stderr}`)
                return
            }

            console.log(`Migration output: ${stdout}`)
        },
    )
}

runMigration()
