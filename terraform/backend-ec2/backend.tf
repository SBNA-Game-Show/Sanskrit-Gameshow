terraform { 
  cloud { 
    
    organization = "sanskrit-gameshow" 

    workspaces { 
      name = "gameshow-backend-ec2" 
    } 
  } 
}
