package web

import (
	"context"
	"encoding/csv"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

type EmailProcessor struct {
	dataFolder string
	scriptPath string
}

type ProcessRequest struct {
	InputFile    string `json:"input_file"`
	UsePlaywright bool   `json:"use_playwright"`
	Filters      Filters `json:"filters"`
}

type Filters struct {
	ExcludeNoEmail bool   `json:"exclude_no_email"`
	MinReviews     int    `json:"min_reviews"`
	Location       string `json:"location"`
}

type ProcessResult struct {
	Success       bool     `json:"success"`
	Results       []EnrichedLead `json:"results"`
	TotalCount    int      `json:"total_count"`
	FilteredCount int      `json:"filtered_count"`
	OutputFile    string   `json:"output_file,omitempty"`
	Error         string   `json:"error,omitempty"`
}

type EnrichedLead struct {
	Forename        string `json:"forename"`
	CompanyName     string `json:"company_name"`
	CompanyLocation string `json:"company_location"`
	GoogleReviews   string `json:"google_reviews"`
	Email           string `json:"email"`
	PhoneNumber     string `json:"phone_number"`
}

func NewEmailProcessor(dataFolder string) *EmailProcessor {
	// Try to find the script relative to the executable or current directory
	scriptPath := "extract_contact_emails.py"
	if _, err := os.Stat(scriptPath); os.IsNotExist(err) {
		// Try in the same directory as the binary
		exePath, err := os.Executable()
		if err == nil {
			scriptPath = filepath.Join(filepath.Dir(exePath), "extract_contact_emails.py")
		}
	}
	
	return &EmailProcessor{
		dataFolder: dataFolder,
		scriptPath: scriptPath,
	}
}

func (ep *EmailProcessor) ListCSVFiles(ctx context.Context) ([]CSVFileInfo, error) {
	files := []CSVFileInfo{}
	
	entries, err := os.ReadDir(ep.dataFolder)
	if err != nil {
		return nil, err
	}
	
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		
		if !strings.HasSuffix(strings.ToLower(entry.Name()), ".csv") {
			continue
		}
		
		// Skip the jobs.db file if it exists
		if entry.Name() == "jobs.db" {
			continue
		}
		
		filePath := filepath.Join(ep.dataFolder, entry.Name())
		info, err := entry.Info()
		if err != nil {
			continue
		}
		
		files = append(files, CSVFileInfo{
			Filename: entry.Name(),
			Path:     filePath,
			Size:     info.Size(),
			Modified: info.ModTime(),
		})
	}
	
	return files, nil
}

type CSVFileInfo struct {
	Filename string    `json:"filename"`
	Path     string    `json:"path"`
	Size     int64     `json:"size"`
	Modified time.Time `json:"modified"`
}

func (ep *EmailProcessor) ProcessCSV(ctx context.Context, req ProcessRequest) (*ProcessResult, error) {
	// Validate input file exists
	if _, err := os.Stat(req.InputFile); os.IsNotExist(err) {
		return &ProcessResult{
			Success: false,
			Error:   "Input file not found",
		}, nil
	}
	
	// Create temp directory for output
	tempDir := filepath.Join(ep.dataFolder, "temp")
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create temp directory: %w", err)
	}
	
	outputFile := filepath.Join(tempDir, fmt.Sprintf("enriched_%d.csv", os.Getpid()))
	
	// Build command
	args := []string{ep.scriptPath, req.InputFile, "-o", outputFile}
	if req.UsePlaywright {
		args = append(args, "--playwright")
	}
	
	cmd := exec.CommandContext(ctx, "python3", args...)
	cmd.Stderr = os.Stderr
	
	err := cmd.Run()
	if err != nil {
		return &ProcessResult{
			Success: false,
			Error:   fmt.Sprintf("Failed to run email extraction script: %v", err),
		}, nil
	}
	
	// Read the output CSV
	results, err := ep.readEnrichedCSV(outputFile)
	if err != nil {
		return &ProcessResult{
			Success: false,
			Error:   fmt.Sprintf("Failed to read output CSV: %v", err),
		}, nil
	}
	
	// Apply filters
	filteredResults := ep.filterResults(results, req.Filters)
	
	return &ProcessResult{
		Success:       true,
		Results:       filteredResults,
		TotalCount:    len(results),
		FilteredCount: len(filteredResults),
		OutputFile:    outputFile,
	}, nil
}

func (ep *EmailProcessor) readEnrichedCSV(filePath string) ([]EnrichedLead, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	
	reader := csv.NewReader(file)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, err
	}
	
	if len(records) < 2 {
		return []EnrichedLead{}, nil
	}
	
	// Skip header row
	results := []EnrichedLead{}
	for i := 1; i < len(records); i++ {
		if len(records[i]) < 6 {
			continue
		}
		
		results = append(results, EnrichedLead{
			Forename:        records[i][0],
			CompanyName:     records[i][1],
			CompanyLocation: records[i][2],
			GoogleReviews:   records[i][3],
			Email:           records[i][4],
			PhoneNumber:     records[i][5],
		})
	}
	
	return results, nil
}

func (ep *EmailProcessor) filterResults(results []EnrichedLead, filters Filters) []EnrichedLead {
	filtered := make([]EnrichedLead, 0, len(results))
	
	for _, result := range results {
		// Exclude businesses without email
		if filters.ExcludeNoEmail && (result.Email == "" || strings.TrimSpace(result.Email) == "") {
			continue
		}
		
		// Filter by minimum reviews
		if filters.MinReviews > 0 {
			reviews := 0
			fmt.Sscanf(result.GoogleReviews, "%d", &reviews)
			if reviews < filters.MinReviews {
				continue
			}
		}
		
		// Filter by location
		if filters.Location != "" {
			locationLower := strings.ToLower(filters.Location)
			if !strings.Contains(strings.ToLower(result.CompanyLocation), locationLower) {
				continue
			}
		}
		
		filtered = append(filtered, result)
	}
	
	return filtered
}

func (ep *EmailProcessor) FilterResults(results []EnrichedLead, filters Filters) []EnrichedLead {
	return ep.filterResults(results, filters)
}

func (ep *EmailProcessor) ExportToCSV(results []EnrichedLead, outputPath string) error {
	file, err := os.Create(outputPath)
	if err != nil {
		return err
	}
	defer file.Close()
	
	writer := csv.NewWriter(file)
	defer writer.Flush()
	
	// Write header
	header := []string{"forename", "company_name", "company_location", "google_reviews", "email", "phone_number"}
	if err := writer.Write(header); err != nil {
		return err
	}
	
	// Write records
	for _, result := range results {
		record := []string{
			result.Forename,
			result.CompanyName,
			result.CompanyLocation,
			result.GoogleReviews,
			result.Email,
			result.PhoneNumber,
		}
		if err := writer.Write(record); err != nil {
			return err
		}
	}
	
	return nil
}

