terraform { 
  cloud { 
    
    organization = "static-html" 

    workspaces { 
      name = "S3-Bucket-Test-HTML" 
    } 
  } 
}
