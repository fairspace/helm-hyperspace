pipeline {
    agent {
      label "jenkins-gradle"
    }
    environment {
      ORG               = 'fairspace'
      APP_NAME          = 'hyperspace'
      DOCKER_REPO       = 'docker-registry.jx.test.fairdev.app'

      CHARTMUSEUM_CREDS = credentials('jenkins-x-chartmuseum')
      DOCKER_REPO_CREDS = credentials('jenkins-x-docker-repo')
    }
    stages {
      stage('Build helm chart') {
        steps {
          dir ('./hyperspace') {
            container('gradle') {
              sh "make build"
            }
          }
        }
      }

      stage('Release helm chart') {
        when {
          branch 'master'
        }
        steps {
          dir ('./hyperspace') {
            container('gradle') {
              // Ensure the git command line tool has access to proper credentials
              sh "git config --global credential.helper store"
              sh "jx step validate --min-jx-version 1.1.73"
              sh "jx step git credentials"

              sh "make tag"
              sh "make release"
            }
          }
        }
      }

      stage('Release helm chart') {
        when {
          branch 'master'
        }
        steps {
          dir ('./hyperspace') {
            container('gradle') {
              sh "helm repo add chartmuseum https://chartmuseum.jx.test.fairdev.app/"
              sh "helm repo update"
              sh "helm install chartmuseum/hyperspace --name=hyperspace-ci --namespace=hyperspace-ci -f ../ci/ci-values.yaml"
            }
          }
        }
      }
    }
    post {
      always {
        cleanWs()
      }
    }
}
