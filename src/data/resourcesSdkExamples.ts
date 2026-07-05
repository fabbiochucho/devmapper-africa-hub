export const sdkLanguages = [
  { lang: 'JavaScript / TypeScript', install: 'npm install @devmapper/sdk', example: `import { DevMapper } from '@devmapper/sdk';

const dm = new DevMapper({ apiKey: 'YOUR_API_KEY' });

// List projects in Kenya targeting SDG 4
const projects = await dm.projects.list({
  country: 'KE',
  sdg: [4],
  status: 'active'
});

console.log(\`Found \${projects.meta.total} projects\`);

// Create a project
const newProject = await dm.projects.create({
  title: 'Digital Literacy Program',
  description: 'Teaching coding skills to rural youth...',
  country_code: 'KE',
  location: 'Nakuru County',
  sdg_goals: [4, 8, 10],
  budget: { allocated: 25000, currency: 'USD' }
});

// Subscribe to webhooks
dm.webhooks.create({
  url: 'https://your-app.com/webhooks',
  events: ['project.verified', 'donation.received']
});` },
  { lang: 'Python', install: 'pip install devmapper', example: `from devmapper import DevMapperClient

dm = DevMapperClient(api_key="YOUR_API_KEY")

# List projects with pagination
projects = dm.projects.list(country="NG", sdg=[1, 2], page=1, per_page=50)

for project in projects.data:
    print(f"{project.title} - {project.status}")

# Get SDG analytics
analytics = dm.analytics.sdg_progress(country="KE", sdg=4)
print(f"SDG 4 score: {analytics.data.africa_average_score}")

# Submit a verification
dm.projects.verify(
    project_id="uuid",
    status="approved",
    comments="Site visit confirmed project activities"
)` },
  { lang: 'cURL', install: 'Built-in — no installation needed', example: `# List projects
curl -X GET "https://api.devmapper.africa/v1/projects?country=KE&sdg=4,13" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# Create a project
curl -X POST "https://api.devmapper.africa/v1/projects" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Clean Water Wells",
    "description": "Installing bore holes in rural communities",
    "country_code": "KE",
    "location": "Turkana County",
    "sdg_goals": [6, 3]
  }'

# Submit verification
curl -X POST "https://api.devmapper.africa/v1/projects/ID/verify" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{ "status": "approved", "comments": "Verified on site" }'` },
  { lang: 'Go', install: 'go get github.com/devmapper/devmapper-go', example: `package main

import (
    "fmt"
    dm "github.com/devmapper/devmapper-go"
)

func main() {
    client := dm.NewClient("YOUR_API_KEY")

    projects, err := client.Projects.List(&dm.ProjectListParams{
        Country: "ZA",
        SDG:     []int{7, 13},
        Status:  "active",
    })
    if err != nil { panic(err) }

    for _, p := range projects.Data {
        fmt.Printf("%s (%s)\\n", p.Title, p.Status)
    }

    stats, _ := client.Analytics.Dashboard(nil)
    fmt.Printf("Total projects: %d\\n", stats.Data.TotalProjects)
}` },
];
