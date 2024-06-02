# Instructions for Initial Setup and Deployment via CI/CD

## Local Setup ##
1. Clone the repository using HTTPS to your computer.  

2. Do one of the two options listed below to test our Cloudformation Template in our local before proceeding with CI/CD deployment;  
- Create a `.env` file in your project's root folder and add all the environment variables in `.env.example` to your `.env`.  
- This .env will only be used for `synth` command. We will NEVER expose this to any deployment.  
- For sanity check, confirm that `.env` is already added to `.gitignore` and it is not tracked in version control.  

3. In your projects's root directory;  
- run `npm run rename` and enter the  name of your project so the script can properly update all corresponding fields with this new name. Note that only alphanumeric  characters, hyphens and underscores are allowed.(no spaces).  
- confirm that you see success messages in the CLI after executing the script.  
- run `npm i` and wait for the dependency installation to be complete.  

4. Now we can verify if our local setup is ready;  
- run `npm run synth` and see if you get any errors. This will do two things;  
  - verify that your `.env` has everything defined in `.env.example`. It will warn you if something is missing.  
  - run `cdk synth` command to emit your cdk stack to CloudFormation template to see if there is any error. 
- a succesful run should output a bunch of texts (aka cloudformation template).  

5. Your local project configuration is now set up. You can now create your NestedStacks in `lib/nested-stacks` and instantiate them in `lib/MainStack.ts`. For convenience, there are a bunch of constructs in `lib/constructs` folder for commonly used services. They are convenient wrappers and they can be modified/extended as desired based on application requirements and developer preferences.  


(Optional): You can install aws-cdk globally and configure your aws cli credentials to use `cdk bootstrap`(only required once per aws account) && `cdk deploy` to deploy your code without CI/CD. However, note that this may require additional configuration depending on the complexity of your project(profiles, env variables etc) and using CI/CD for deployment is the recommended approach.  

## CI/CD Configuration and Deployment via Github Workflows/Actions
(will be updated)  

