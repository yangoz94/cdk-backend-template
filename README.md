# Instructions for Initial Setup and Deployment via CI/CD

## Prerequisites ##
- AWS account and a good understanding of AWS services and billing/cost management  
- Nodejs/npm installation  
- aws-cdk installation  

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

1. The repository has CI/CD workflow defined in `.github/workflows/main.yml` for `develop` and `main` branches. Any push to these branches will trigger CI/CD. However, for the action to run succesfully, we need to create `develop` and `main` environments and inject some secrets into them via Github Secrets. To do that;  
- Go to your repository `settings` on Github.  
- Click `Environments` and create two environments called `develop` and `main`. This is how workflow file is set up out of the box and it will look for these environments during deployment. You can change their names however you like in the `main.yml` workflow and update your environments correspondingly. If you only need `main` branch configuration for example, you don't need to create `develop` environment.  
- Click `Secrets and Variables` and then `Actions`  
- Set the following env variables as either repository secrets or environment secrets(if you are using multiple environments(dev,qa,prod etc and values change depending on the environment))  
`ENVIRONMENT` : `develop` or `main` for the original workfile. Should be added as an environment secret  
`AWS_ACCESS_KEY_ID`  : your aws account access key id  
`AWS_SECRET_ACCESS_KEY` : your aws account secret access key  

2. Next, add all the env variables in your local `.env` as a repository or environment variable(or a secret). Keep in mind that secrets cannot be viewed after saving them while variables can always be viewed.

Your secrets and variables should look like this;
<img width="805" alt="Screenshot 2024-06-02 at 8 00 44 PM" src="https://github.com/yangoz94/cdk-backend-template/assets/95255319/7bd9b312-9ae1-4f64-a9f8-49f00c1dcf35">
<img width="801" alt="Screenshot 2024-06-02 at 8 03 47 PM" src="https://github.com/yangoz94/cdk-backend-template/assets/95255319/1e8d050e-0913-4ae6-bfa2-091df54c90ef">

3. Remember that every time you need a new env variable, you need to add them to the following;  
- to `env` field for each branch in `.github/workflow/main.yml` file  
- to `bin/{your_app_name}.ts` file as a prop to introduce it to your main stack  
- to any nested stack as a prop that will inherit the env variable from the parent stack 

In addition, for your local development, you will also need to update your `.env` and `.env.example` for consistency.  

4. Now, you can either directly push or make a PR to your `develop` or `main` branches(create them if you don't have them) and the deployment will execute automatically on condition that you followed all the steps carefully.  Your deployment status can be tracked in the `actions` tab of your github repository.  






