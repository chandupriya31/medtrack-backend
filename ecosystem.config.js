module.exports = {
    apps: [
        {
            name: "MEDTRACK",
            script: "app.js",
            instances: 1,
            exec_mode: "cluster",
            watch: false,
            "node_args": "--max-old-space-size=1024 --expose-gc",
            out_file: "./logs/output.log",
            error_file: "./logs/error.log",
            merge_logs: true,
            instance_var: 'INSTANCE_ID',
            env: {
                "PORT": 3001,
                "NODE_ENV": "production",
                "TZ": "Asia/Kolkata"
            }
        }
    ]
}
