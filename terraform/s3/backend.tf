terraform { 
  cloud { 
    
    organization = "sanskrit-gameshow" 

    workspaces { 
      name = "gameshow-s3" 
    } 
  } 
}
